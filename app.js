import { Server } from "socket.io";
import { format } from "date-fns";

const io = new Server(3000, {
  cors: { origin: "https://casino.jacksongaringer.com" },
});

const millisecondsBetweenSpins = 12_000;
const spinDurationMilliseconds = 6_000;
const spinOffsetAbsoluteValue = 15;
const gameState = {
  outcome: null,
  spinning: false,
  spinStart: null,
  spinEnd: null,
  spinOffset: null,
  nextSpin: Date.now() + millisecondsBetweenSpins,
  pastGames: [],
};

let spinCount = 0;

const getOutcome = () => Math.floor(Math.random() * 15);
const getSpinOffset = (abs) => Math.floor(Math.random() * (abs * 2 + 1)) - abs;
const emitGameState = () => {
  io.emit("gameState", gameState);
  console.log(
    "[Game State]",
    "outcome:",
    gameState.outcome,
    "spinning:",
    gameState.spinning,
    "spinOffset:",
    gameState.spinOffset,
    "spinStart:",
    format(gameState.spinStart || new Date(0), "h:mm:ss a"),
    "spinEnd:",
    format(gameState.spinEnd || new Date(0), "h:mm:ss a"),
    "nextSpin:",
    format(gameState.nextSpin, "h:mm:ss a"),
    "pastGames:",
    gameState.pastGames.length
  );
};

io.on("connection", (socket) => {
  console.log("[Connection] User connected");
  emitGameState();
});

const spin = () => {
  gameState.outcome = getOutcome();
  gameState.spinning = true;
  gameState.spinStart = new Date();
  gameState.spinEnd = new Date(Date.now() + spinDurationMilliseconds);
  gameState.spinOffset = getSpinOffset(spinOffsetAbsoluteValue);
  gameState.nextSpin = Date.now() + millisecondsBetweenSpins;

  spinCount++;
  emitGameState();
};

setInterval(() => {
  spin();

  setTimeout(() => {
    gameState.pastGames.push({
      id: spinCount,
      outcome: gameState.outcome,
      date: gameState.spinStart,
    });

    if (gameState.pastGames.length > 10) {
      gameState.pastGames.shift();
    }

    gameState.spinning = false;
    emitGameState();
  }, spinDurationMilliseconds);
}, millisecondsBetweenSpins);
