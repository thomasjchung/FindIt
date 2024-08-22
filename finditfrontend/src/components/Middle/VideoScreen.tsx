import { useEffect, useRef, useContext } from "react";
import { Box } from "@mui/material";
import WebContext from "../Web-Context";

type VideoScreenProps = {
  screenHeight: number;
  playerVideo: MediaStream | null;
  scoreFunction: () => void;
};

export const VideoScreen = ({
  screenHeight,
  playerVideo,
  scoreFunction,
}: VideoScreenProps) => {
  const webCtx = useContext(WebContext);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (playerVideo && videoRef.current) {
      videoRef.current.srcObject = playerVideo;
      videoRef.current.play();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        console.log("JUST FINISHED TRACKS LMAO");
      }
    };
  }, [playerVideo]);

  useEffect(() => {
    const sendFrameToBackend = (frameData: string, word: string) => {
      fetch("https://thommyson.pythonanywhere.com/process_frame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word,
          frame: frameData,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to send frame to backend");
          }
          return response.json();
        })
        .then((data) => {
          if (data.word_in_image) {
            console.log("Found word!");
            scoreFunction();
          } else {
            console.log("Word not found smh");
          }
        })
        .catch((error) => {
          console.error("Error sending frame to backend lol:", error);
        });
    };

    const captureAndSendFrame = () => {
      if (videoRef.current) {
        console.log("Running captureandsendframe");
        const canvas = document.createElement("canvas");
        const videoToSend = videoRef.current;
        canvas.width = videoToSend.videoWidth;
        canvas.height = videoToSend.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(videoToSend, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg");
        console.log("Word is", webCtx.word);
        sendFrameToBackend(imageData, webCtx.word);
      } else {
        console.log("Video ref isn't current");
      }
    };

    const captureInterval = setInterval(captureAndSendFrame, 1500);

    return () => {
      clearInterval(captureInterval);
    };
  }, [scoreFunction, webCtx.word]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        border: "2px solid #3cdfff",
        height: screenHeight,
        flexShrink: 0,
        flexGrow: 0,
      }}
    >
      <video
        ref={videoRef}
        style={{ width: "auto", height: "100%" }}
        autoPlay
        playsInline // Important for iOS devices
      />
    </Box>
  );
};
