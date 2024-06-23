import React, { useState, useContext } from "react";
import { Heading } from "./components/Top/Heading";
import { GameScreen } from "./components/Middle/GameScreen";
import Scoreboard from "./components/Bottom/Scoreboard";
import WebContext from "./components/Web-Context";

const App: React.FC = () => {
  const player1Name = "Thomas";
  const player2Name = "Farhan";

  const webCtx = useContext(WebContext);

  return (
    <div className="App">
      <Heading />
      <GameScreen screenHeight={500} />
      <Scoreboard player1Name={player1Name} player2Name={player2Name} />
    </div>
  );
};

export default App;
