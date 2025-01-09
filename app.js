if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidV4 } = require("uuid");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: "https://what-the-chess-52a3d.web.app/",
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

  socket.on("createRoom", async (callback) => {
    const roomId = uuidV4();
    await socket.join(roomId);

    rooms.set(roomId, {
      roomId,
      players: [{ id: socket.id, username: socket.data?.username }],
      spectators: [],
    });

    console.log(
      `[${new Date().toISOString()}] Room ${roomId} created by ${
        socket.data.username
      }`
    );
    callback(roomId);
  });

  socket.on("joinRoom", async (args, callback) => {
    const room = rooms.get(args.roomId);
    if (!room) {
      return callback({ error: true, message: "Room does not exist" });
    }

    if (room.players.some((s) => s.username === socket.data.username)) {
      return callback({
        error: true,
        message: "Username already in use in this room",
      });
    }

    if (room.players.length < 2) {
      await socket.join(args.roomId);

      room.players.push({ id: socket.id, username: socket.data.username });
      rooms.set(args.roomId, room);

      callback(room);
      socket.to(args.roomId).emit("opponentJoined", room);
    } else {
      await socket.join(args.roomId);
      room.spectators.push({ id: socket.id, username: socket.data.username });
      rooms.set(args.roomId, room);

      callback(room);
      socket.emit("spectatorJoined", room);
      socket.to(args.roomId).emit("spectatorJoined", room);
    }
  });

  socket.on("move", (data) => {
    const room = rooms.get(data.room);
    if (room.players.some((p) => p.id === socket.id)) {
      socket.to(data.room).emit("move", data.move);
    }
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);

    rooms.forEach((room) => {
      const user = room.players.find((player) => player.id === socket.id);
      const spectator = room.spectators.find(
        (spectator) => spectator.id === socket.id
      );

      if (user) {
        if (room.players.length < 2) {
          rooms.delete(room.roomId);
        } else {
          io.to(room.roomId).emit("playerDisconnected", {
            players: room.players,
          });
        }
      }

      if (spectator) {
        room.spectators = room.spectators.filter(
          (spec) => spec.id !== socket.id
        );

        console.log(`Spectator ${socket.id} removed from room ${room.roomId}`);

        io.to(room.roomId).emit("spectatorDisconnected", {
          spectators: room.spectators,
        });
      }
    });
  });

  socket.on("leaveRoom", async (data) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    if (room) {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);

      const spectatorIndex = room.spectators.findIndex(
        (spec) => spec.id === socket.id
      );

      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);

        if (room.players.length < 2) {
          rooms.delete(roomId);
        }

        io.to(roomId).emit("playerDisconnected", {
          username: socket.data.username,
        });
      }

      if (spectatorIndex !== -1) {
        room.spectators.splice(spectatorIndex, 1);

        console.log(`Spectator ${socket.id} left room ${roomId}`);

        io.to(roomId).emit("spectatorDisconnected", {
          username: socket.data.username,
          spectators: room.spectators,
        });
      }
    }
  });

  socket.on("closeRoom", async (data) => {
    socket.to(data.roomId).emit("closeRoom", data);

    const clientSockets = await io.in(data.roomId).fetchSockets();

    clientSockets.forEach((s) => {
      s.leave(data.roomId);
    });

    rooms.delete(data.roomId);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
