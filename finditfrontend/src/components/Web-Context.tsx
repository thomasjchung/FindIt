import React, { useEffect, useState, createContext, ReactNode } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  onSnapshot,
  DocumentSnapshot,
  DocumentChange,
  QuerySnapshot,
} from "firebase/firestore";
import firebaseConfig from "../firebaseConfig";

interface WebContextType {
  local: MediaStream | null;
  remote: MediaStream | null;
  pcConnect: RTCPeerConnection | null;
  callID: string;
  word: string;
  handleCreate: () => Promise<void>;
  handleAnswer: () => Promise<void>;
  setCallID: (id: string) => void;
  setWord: () => Promise<void>;
  getWord: () => Promise<string>;
  localScore: number;
  remoteScore: number;
  setLocalScore: () => Promise<void>;
  setRemoteScore: () => Promise<void>;
  getLocalScore: () => Promise<number>;
  getRemoteScore: () => Promise<number>;
  currentTime: number;
  checkActive: boolean;
  handleStart: () => void;
  handlePauseResume: () => void;
  handleReset: () => void;
}

interface WebContextProviderProps {
  children: ReactNode;
}

const WebContext = createContext<WebContextType>({
  local: null,
  remote: null,
  pcConnect: null,
  callID: "",
  word: "",
  handleCreate: async () => {},
  handleAnswer: async () => {},
  setCallID: (id: string) => {},
  setWord: async () => {},
  getWord: async () => "",
  localScore: 0,
  remoteScore: 0,
  setLocalScore: async () => {},
  setRemoteScore: async () => {},
  getLocalScore: async () => 0,
  getRemoteScore: async () => 0,
  currentTime: 0,
  checkActive: false,
  handleStart: () => {},
  handlePauseResume: () => {},
  handleReset: () => {},
});

export function WebContextProvider(props: WebContextProviderProps) {
  const firebaseApp = initializeApp(firebaseConfig);
  const firestore = getFirestore(firebaseApp);

  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [callId, setCallId] = useState<string>("");
  const [word, setWordState] = useState<string>("cell phone");
  const [roundOver, setRoundState] = useState<boolean>(false);

  const words = [
    "person",
    "bicycle",
    "car",
    "cat",
    "dog",
    "backpack",
    "umbrella",
    "handbag",
    "tie",
    "suitcase",
    "frisbee",
    "sports ball",
    "skateboard",
    "tennis racket",
    "bottle",
    "wine glass",
    "cup",
    "fork",
    "knife",
    "spoon",
    "bowl",
    "banana",
    "apple",
    "sandwich",
    "orange",
    "chair",
    "couch",
    "potted plant",
    "bed",
    "dining table",
    "toilet",
    "tv",
    "laptop",
    "mouse",
    "remote",
    "keyboard",
    "cell phone",
    "microwave",
    "toaster",
    "book",
    "clock",
    "vase",
    "scissors",
    "hair drier",
    "toothbrush",
  ];

  useEffect(() => {
    const setupMedia = async () => {
      const newPc = new RTCPeerConnection(servers);
      setPc(newPc);

      const local = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const remote = new MediaStream();

      local.getTracks().forEach((track) => {
        newPc.addTrack(track, local);
      });
      newPc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remote.addTrack(track);
        });
      };

      setLocalStream(local);
      setRemoteStream(remote);
    };

    setupMedia();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
      pc?.close();
    };
  }, []);

  const handleCreateOffer = async () => {
    if (!pc) return;
    console.log("Entering handleCreateOffer");

    const callDocRef = doc(collection(firestore, "calls"));
    const offerCandidates = collection(callDocRef, "offerCandidates");
    const answerCandidates = collection(callDocRef, "answerCandidates");

    setCallId(callDocRef.id);

    pc.onicecandidate = (event) => {
      console.log("ICE candidate event: ", event);
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
        console.log("New ICE candidate: ", event.candidate);
      } else {
        console.log("ICE ERROR: No ICE candidate");
      }
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDocRef, { offer });

    onSnapshot(callDocRef, (snapshot: DocumentSnapshot) => {
      const data = snapshot.data();
      if (data?.answer && !pc.currentRemoteDescription) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    onSnapshot(answerCandidates, (snapshot: QuerySnapshot) => {
      snapshot.docChanges().forEach((change: DocumentChange) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          if (pc) {
            pc.addIceCandidate(candidate);
          }
        }
      });
    });
    console.log("DONE!!!");
  };

  const handleAnswerCall = async () => {
    if (!pc) {
      console.error("Peer connection is null");
      return;
    }

    if (!callId) {
      console.error("Call ID is empty");
      return;
    }

    const callDocRef = doc(collection(firestore, "calls"), callId);
    const offerCandidates = collection(callDocRef, "offerCandidates");
    const answerCandidates = collection(callDocRef, "answerCandidates");

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      } else {
      }
    };

    const callSnapshot = await getDoc(callDocRef);
    const callData = callSnapshot.data();
    if (callData && callData.offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

      if (pc.signalingState !== "have-remote-offer") {
        console.error(
          `Expected signaling state 'have-remote-offer' but got ${pc.signalingState}`
        );
        return;
      }

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answer = {
        sdp: answerDescription.sdp,
        type: answerDescription.type,
      };
      await setDoc(callDocRef, { answer }, { merge: true });

      onSnapshot(offerCandidates, (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach((change: DocumentChange) => {
          if (change.type === "added") {
            const data = change.doc.data();
            pc.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    } else {
      console.error("No offer found in Firestore");
    }
  };

  const setWord = async (): Promise<void> => {
    if (!callId) {
      console.error("Call ID is empty");
      return;
    }

    handleReset();
    handleStart();
    setRoundState(false);
    const newWord = words[Math.floor(Math.random() * words.length)];

    const callDocRef = doc(collection(firestore, "calls"), callId);
    const wordDocRef = doc(collection(callDocRef, "words"), "currentWord");
    setWordState(newWord);
    console.log("Set word to ", newWord);
    await setDoc(wordDocRef, { word: newWord }, { merge: true });
  };

  const getWord = async (): Promise<string> => {
    if (!callId) {
      console.error("Call ID is empty");
      return "";
    }

    const callDocRef = doc(collection(firestore, "calls"), callId);
    const wordDocRef = doc(collection(callDocRef, "words"), "currentWord");
    const wordSnapshot = await getDoc(wordDocRef);
    const wordData = wordSnapshot.data();
    return wordData?.word || "";
  };

  useEffect(() => {
    if (callId) {
      const callDocRef = doc(collection(firestore, "calls"), callId);
      const wordDocRef = doc(collection(callDocRef, "words"), "currentWord");

      const unsubscribe = onSnapshot(wordDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.word) {
          setWordState(data.word);
        }
      });

      return () => unsubscribe();
    }
  }, [callId]);

  const [localPoint, setLocalPoint] = useState<number>(0);
  const [remotePoint, setRemotePoint] = useState<number>(0);

  const setLocalScore = async (): Promise<void> => {
    if (!callId) {
      console.error("Call ID is empty");
      return;
    }

    const newScore = localPoint + 1;

    const callDocRef = doc(collection(firestore, "calls"), callId);
    const wordDocRef = doc(
      collection(callDocRef, "localScore"),
      "currentScore"
    );
    if (!roundOver) {
      setLocalPoint(newScore);
      await setDoc(wordDocRef, { score: newScore }, { merge: true });
      setRoundState(true);
    } else {
      return;
    }
  };

  const setRemoteScore = async (): Promise<void> => {
    if (!callId) {
      console.error("Call ID is empty");
      return;
    }

    setIsPaused(true);

    const newScore = remotePoint + 1;

    const callDocRef = doc(collection(firestore, "calls"), callId);
    const wordDocRef = doc(
      collection(callDocRef, "remoteScore"),
      "currentScore"
    );
    if (!roundOver) {
      setRemotePoint(newScore);
      await setDoc(wordDocRef, { score: newScore }, { merge: true });
      setRoundState(true);
    }
  };

  const getLocalScore = async (): Promise<number> => {
    console.log("running getLocalScore");
    if (!callId) {
      console.error("Call ID is empty");
      return 0;
    }

    const callDocRef = doc(collection(firestore, "calls"), callId);
    const wordDocRef = doc(
      collection(callDocRef, "localScore"),
      "currentScore"
    );
    const wordSnapshot = await getDoc(wordDocRef);
    const wordData = wordSnapshot.data();
    return wordData?.score || 0;
  };

  const getRemoteScore = async (): Promise<number> => {
    if (!callId) {
      console.error("Call ID is empty");
      return 0;
    }
    const callDocRef = doc(collection(firestore, "calls"), callId);
    const wordDocref = doc(
      collection(callDocRef, "remoteScore"),
      "currentScore"
    );
    const wordSnapshot = await getDoc(wordDocref);
    const wordData = wordSnapshot.data();
    return wordData?.score || 0;
  };

  useEffect(() => {
    if (callId) {
      const callDocRef = doc(collection(firestore, "calls"), callId);
      const wordDocRef = doc(
        collection(callDocRef, "localScore"),
        "currentScore"
      );

      const unsubscribe = onSnapshot(wordDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.score) {
          setLocalPoint(data.score);
        }
      });

      return () => unsubscribe();
    }
  }, [callId]);

  useEffect(() => {
    if (callId) {
      const callDocRef = doc(collection(firestore, "calls"), callId);
      const wordDocRef = doc(
        collection(callDocRef, "remoteScore"),
        "currentScore"
      );

      const unsubscribe = onSnapshot(wordDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.score) {
          setLocalPoint(data.score);
        }
      });

      return () => unsubscribe();
    }
  }, [callId]);

  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [time, setTime] = useState<number>(0);

  /*
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else if (interval !== null) {
      clearInterval(interval);
    }

    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [isActive, isPaused]);

  */
  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(0);
  };

  const context: WebContextType = {
    local: localStream,
    remote: remoteStream,
    pcConnect: pc,
    callID: callId,
    word,
    handleCreate: handleCreateOffer,
    handleAnswer: handleAnswerCall,
    setCallID: setCallId,
    setWord,
    getWord,
    localScore: localPoint,
    remoteScore: remotePoint,
    setLocalScore: setLocalScore,
    setRemoteScore: setRemoteScore,
    getLocalScore,
    getRemoteScore,
    currentTime: time,
    checkActive: isActive,
    handleStart,
    handlePauseResume,
    handleReset,
  };

  return (
    <WebContext.Provider value={context}>{props.children}</WebContext.Provider>
  );
}

export default WebContext;
