const express = require("express");
const http = require("http");
const { Chess } = require("chess.js");
const { Server } = require("socket.io");
const { v4: uuidV4 } = require("uuid");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: "*", // Replace '*' with your frontend domain in production
  methods: ["GET", "POST"],
});

const rooms = new Map();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to What The Chess API!" });
});

io.on("connection", (socket) => {
  console.log(socket.id, "connected");

  socket.on("username", (username) => {
    console.log("username:", username);
    socket.data.username = username;
  });

  // createRoom
  socket.on("createRoom", async (callback) => {
    const roomId = uuidV4();
    await socket.join(roomId);

    rooms.set(roomId, {
      chess: new Chess(),
      players: {
        white: { id: socket.id, username: socket.data.username },
        black: null,
      },
      spectators: [],
    });

    console.log(
      `[${new Date().toISOString()}] Room ${roomId} created by ${
        socket.data.username
      }`
    );
    callback({ success: true, roomId });
  });

  socket.on("move", (data, callback) => {
    const room = rooms.get(data.roomId);

    if (!room) {
      return callback({ error: true, message: "Room does not exist" });
    }

    const game = room.chess;

    const turn = game.turn() === "w" ? "white" : "black";
    if (room.players[turn]?.id !== socket.id) {
      return callback({ error: true, message: "Not your turn" });
    }

    const move = game.move(data.move);

    if (!move) {
      return callback({ error: true, message: "Invalid move" });
    }

    console.log(
      `[${new Date().toISOString()}] Move in Room ${data.roomId}: ${data.move}`
    );

    // Check game-end conditions
    if (game.in_checkmate()) {
      io.to(data.roomId).emit("gameOver", {
        winner: socket.data.username,
        reason: "checkmate",
      });
    } else if (game.in_draw()) {
      io.to(data.roomId).emit("gameOver", { winner: null, reason: "draw" });
    }

    io.to(data.roomId).emit("move", { move, board: game.fen() });
    callback({ success: true, board: game.fen() });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
