import { Button, ButtonGroup, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { useContext, useEffect, useState } from "react";
import WebContext from "../Web-Context";

export const Heading = () => {
  const webCtx = useContext(WebContext);
  const [currentWord, setCurrentWord] = useState<string>(webCtx.word);
  const [currentTime, setCurrentTime] = useState<boolean>(false);

  useEffect(() => {
    const fetchWord = async () => {
      const fetchedWord = await webCtx.getWord();
      setCurrentWord(fetchedWord);
    };
    fetchWord();
  }, [webCtx.word, webCtx.getWord]);

  const handlePauseResume = () => {
    webCtx.handlePauseResume();
    setCurrentTime(!currentTime);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ border: "2px solid #3cdfff", p: 2 }}
    >
      <Typography variant="h6">Word</Typography>
      <Typography variant="h3" sx={{ p: 2 }}>
        {currentWord}
      </Typography>
      <ButtonGroup variant="outlined">
        <Button sx={{ color: "#cccccc", borderColor: "#3cdfff" }}>End</Button>
        <Button
          onClick={() => handlePauseResume()}
          sx={{ color: "#cccccc", borderColor: "#3cdfff" }}
        >
          {currentTime ? "Pause" : "Resume"}
        </Button>
        <Button
          onClick={async () => {
            await webCtx.setWord();
          }}
          sx={{ color: "#cccccc", borderColor: "#3cdfff" }}
        >
          Next
        </Button>
      </ButtonGroup>
    </Box>
  );
};
