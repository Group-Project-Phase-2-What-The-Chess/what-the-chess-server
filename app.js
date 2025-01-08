const express = require("express");
const http = require("http");
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

  socket.on("createRoom", async (callback) => {
    const roomId = uuidV4();
    await socket.join(roomId);

    rooms.set(roomId, {
      roomId,
      players: [{ id: socket.id, username: socket.data?.username }],
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

    const allUsers = [room.players.map((s) => s.username)];
    if (allUsers.includes(socket.data.username)) {
      return callback({
        error: true,
        message: "Username already in use in this room",
      });
    }

    await socket.join(args.roomId);
    const updateRoom = {
      ...room,
      players: [
        ...room.players,
        { id: socket.id, username: socket.data.username },
      ],
    };

    rooms.set(args.roomId, updateRoom);

    callback(updateRoom);

    socket.to(args.roomId).emit("opponentJoined", updateRoom);
  });

  socket.on("move", (data) => {
    socket.to(data.room).emit("move", data.move);
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);

    rooms.forEach((room) => {
      const user = room.players.find((player) => player.id === socket.id);

      if (user) {
        if (room.players.length < 2) {
          rooms.delete(room.roomId);
        } else {
          io.to(room.roomId).emit("playerDisconnected", {
            players: room.players,
          });
        }
      }
    });
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
