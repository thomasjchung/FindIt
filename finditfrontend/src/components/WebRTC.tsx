// src/components/WebRTC.tsx
import React, { useEffect, useState } from "react";
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

const WebRTC: React.FC = () => {
  // Initialize Firebase
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
  }, []); // Note: pc and localStream are not in dependency array to prevent reinitializing

  // Implement the rest of the functions as needed

  const handleCreateOffer = async () => {
    if (!pc) return; // Guard against pc being null

    // Use collection and doc functions directly
    const callDocRef = doc(collection(firestore, "calls"));
    const offerCandidates = collection(callDocRef, "offerCandidates");
    const answerCandidates = collection(callDocRef, "answerCandidates");

    // Set call ID for input field
    setCallId(callDocRef.id);

    // Get candidates for caller, save to db

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    // Create offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    // Convert to plain JS object
    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    // Save offer to Firestore
    await setDoc(callDocRef, { offer });

    // Listen for remote answer
    onSnapshot(callDocRef, (snapshot: DocumentSnapshot) => {
      const data = snapshot.data();
      if (data?.answer && !pc.currentRemoteDescription) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // When answered, add candidate to peer connection
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
    console.log("Finished handleCreating Offer");
  };

  const handleAnswerCall = async () => {
    console.log("Entering handleAnswerCall");
    if (!pc) {
      console.error("Peer connection is null");
      return;
    }

    if (!callId) {
      console.error("Call ID is empty");
      return;
    }
    //if (!pc) return;

    const callDocRef = doc(collection(firestore, "calls"), callId);
    const offerCandidates = collection(callDocRef, "offerCandidates");
    const answerCandidates = collection(callDocRef, "answerCandidates");

    // Setup to handle ICE candidates from the caller
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    // Fetch the offer from Firestore
    const callSnapshot = await getDoc(callDocRef);
    const callData = callSnapshot.data();
    if (callData && callData.offer) {
      // Set remote description with the received offer
      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
      console.log("Remote description set");

      // Check if the state is correct before creating the answer
      if (pc.signalingState !== "have-remote-offer") {
        console.error(
          `Expected signaling state 'have-remote-offer' but got ${pc.signalingState}`
        );
        return;
      }

      // Create and set the local answer
      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      // Save the answer to Firestore
      const answer = {
        sdp: answerDescription.sdp,
        type: answerDescription.type,
      };
      await setDoc(callDocRef, { answer }, { merge: true });

      // Listen for ICE candidates from the offerer
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

  const handleHangup = () => {
    // Clean up resources and reset states
  };

  return (
    <div>
      <div className="videos">
        <video
          autoPlay
          playsInline
          ref={(video) => video && (video.srcObject = localStream)}
        />
        <video
          autoPlay
          playsInline
          ref={(video) => video && (video.srcObject = remoteStream)}
        />
      </div>
      <h2>2. Oh hell no Create a new Call</h2>
      <button onClick={handleCreateOffer} disabled={!localStream}>
        Create Call (offer)
      </button>
      <h2>3. Join a Call</h2>
      <input value={callId} onChange={(e) => setCallId(e.target.value)} />
      <button onClick={handleAnswerCall} disabled={!callId}>
        {callId ? "hello" : "No"}
      </button>
      <h2>4. Hangup</h2>
      <button onClick={handleHangup}>Hangup</button>
    </div>
  );
};

export default WebRTC;
