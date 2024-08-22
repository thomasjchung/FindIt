import { Box, Typography } from "@mui/material";

interface PlayerProps {
  name: string;
  score: number;
}

const Player: React.FC<PlayerProps> = ({ name, score }) => {
  return (
    <Box display="flex" alignItems="center" flexDirection="column">
      <Typography variant="h6">{name}</Typography>
      <Typography variant="h1">{score}</Typography>
    </Box>
  );
};

export default Player;
