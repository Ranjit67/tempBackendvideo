const express = require("express");

const socket = require("socket.io");
const cors = require("cors");

const app = express();
const http = require("http");
const server = http.createServer(app);
const io = socket(server, {
  cors: {
    origin: "*",
  },
});
const users = {};
const socketToRoom = {};
const host = {};
const hostIdToRoom = {};
io.on("connection", (socket) => {
  // conection
  socket.on("uui", (roomID) => {
    if (users[roomID]) {
      const arr = users[roomID];
      arr.push(socket.id);
      users[roomID] = arr;
      // console.log(users[roomID]);
      socketToRoom[socket.id] = roomID;
      const userInThisRoom = users[roomID].filter((id) => id !== socket.id);

      socket.emit("all user", {
        userInThisRoom,
        id: host[roomID],
        selfId: socket.id,
      });
      // }
    } else {
      users[roomID] = [socket.id];
      host[roomID] = socket.id;
      hostIdToRoom[socket.id] = roomID;
    }
  });
  // for extra

  io.emit("for join", users);
  socket.on("for request", (data) => {
    // console.log(data);
    io.to(data.host).emit("permission", {
      user: data.userID,
      hostId: data.host,
    });
  });
  socket.on("accept call", (data) => {
    // console.log(data);
    if (data.accept) {
      // console.log(hostIdToRoom[data.hostId]);
      const roomID = hostIdToRoom[data.hostId];
      const userInThisRoom = users[roomID].filter((id) => id !== socket.id);
      //data.requesterId
      console.log(data.requesterId);
      io.to(data.requesterId).emit("permission granted", {
        requestId: data.requesterId,
        userInThisRoom: userInThisRoom,
        myId: socket.id,
      });
      const userInThisRoomforHost = users[roomID].filter(
        (id) => id !== socket.id
      );
      socket.emit("After permission", {
        userInThisRoomforHost: userInThisRoomforHost,
      });
    }
  });
  //extra end
  socket.on("id", (id) => {
    const roomID = socketToRoom[socket.id];
    socket.broadcast.emit("global send", id);
  });

  socket.on("sanding signal", (paylod) => {
    io.to(paylod.remoteSocketid).emit("user join", {
      signal: paylod.signal,
      hostId: paylod.selfId,
    });
  });
  socket.on("returning signal", (paylode) => {
    // console.log(paylode.callerID);
    io.to(paylode.callerID).emit("receiving returning signal", {
      userToHost: paylode.signal,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    // console.log(socket.id);
    const roomID = socketToRoom[socket.id];
    socket.broadcast.emit("take leave", { id: socket.id });
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
  });
});
//route
app.get("/remote", (res, req) => {
  res.send("data");
});
server.listen(process.env.PORT || 4000, () => {
  console.log("4000 port is ready to start.");
});
