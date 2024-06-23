import { Box, Typography } from "@mui/material";

interface StopwatchProps {
  time: number;
}

const Stopwatch: React.FC<StopwatchProps> = (props) => {
  return (
    <Box className="timer" display="flex">
      <Typography className="digits" variant="h4">
        {("0" + Math.floor((props.time / 60000) % 60)).slice(-2)}:
      </Typography>
      <Typography className="digits" variant="h4">
        {("0" + Math.floor((props.time / 1000) % 60)).slice(-2)}.
      </Typography>
      <Typography className="digits mili-sec" variant="h4">
        {("0" + ((props.time / 10) % 100)).slice(-2)}
      </Typography>
    </Box>
  );
};

export default Stopwatch;
