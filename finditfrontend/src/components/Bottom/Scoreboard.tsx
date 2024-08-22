import { Grid, Typography } from "@mui/material";
import Player from "./Player";
import { useContext, useEffect, useState } from "react";
import WebContext from "../Web-Context";
import { onSnapshot, doc, getFirestore } from "firebase/firestore";

interface ScoreboardProps {
  player1Name: string;
  player2Name: string;
}

const Scoreboard: React.FC<ScoreboardProps> = ({
  player1Name,
  player2Name,
}) => {
  const webCtx = useContext(WebContext);

  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);

  useEffect(() => {
    const fetchScores = async () => {
      const localScore = await webCtx.getLocalScore();
      const remoteScore = await webCtx.getRemoteScore();
      setPlayer1Score(localScore);
      setPlayer2Score(remoteScore);
    };

    fetchScores();

    // Ensure callId is not empty
    if (webCtx.callID) {
      const firestore = getFirestore();
      const callDocRef = doc(firestore, "calls", webCtx.callID);
      const localScoreRef = doc(callDocRef, "localScore", "currentScore");
      const remoteScoreRef = doc(callDocRef, "remoteScore", "currentScore");

      const unsubscribeLocal = onSnapshot(localScoreRef, (doc) => {
        const data = doc.data();
        if (data?.score !== undefined) {
          setPlayer1Score(data.score);
        }
      });

      const unsubscribeRemote = onSnapshot(remoteScoreRef, (doc) => {
        const data = doc.data();
        if (data?.score !== undefined) {
          setPlayer2Score(data.score);
        }
      });

      // Cleanup listeners on unmount
      return () => {
        unsubscribeLocal();
        unsubscribeRemote();
      };
    }
  }, [webCtx.callID, webCtx]);

  return (
    <Grid container>
      <Grid item xs={5}>
        <Player name={player1Name} score={player1Score} />
      </Grid>
      <Grid item xs={2}>
        <Typography variant="h1" mt={3}>
          -
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <Player name={player2Name} score={player2Score} />
      </Grid>
    </Grid>
  );
};

export default Scoreboard;
