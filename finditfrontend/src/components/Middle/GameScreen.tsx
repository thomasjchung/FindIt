import { Box, Button, ButtonGroup } from "@mui/material";
import { VideoScreen } from "./VideoScreen";
import { useContext, useEffect } from "react";
import WebContext from "../Web-Context";
import Stopwatch from "./Stopwatch";

type GameScreenProps = {
  screenHeight: number;
};

export const GameScreen = (props: GameScreenProps) => {
  const webCtx = useContext(WebContext);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{ border: "#3cdfff" }}
    >
      <VideoScreen
        screenHeight={props.screenHeight}
        playerVideo={webCtx.local}
        scoreFunction={webCtx.setLocalScore}
      />
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{
          border: "2px solid #3cdfff",
          flexGrow: 1,
          height: props.screenHeight,
        }}
      >
        <Stopwatch time={webCtx.currentTime} />
        <Button
          onClick={webCtx.handleCreate}
          sx={{ color: "#cccccc", borderColor: "#3cdfff" }}
          disabled={!webCtx.local}
        >
          Create Call
        </Button>
        <input
          value={webCtx.callID}
          onChange={(e) => webCtx.setCallID(e.target.value)}
        />
        <Button
          onClick={webCtx.handleAnswer}
          sx={{ color: "#cccccc", borderColor: "#3cdfff" }}
          disabled={!webCtx.callID}
        >
          Answer
        </Button>
      </Box>
      <VideoScreen
        screenHeight={props.screenHeight}
        playerVideo={webCtx.remote}
        scoreFunction={webCtx.setRemoteScore}
      />
    </Box>
  );
};
