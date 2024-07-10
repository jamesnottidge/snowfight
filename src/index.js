const express = require("express");
const { createServer } = require("http");
const { resolve } = require("path");

const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer);
const loadMap = require("./mapLoader");

const TICK_RATE = 30;
const SPEED = 5;

function tick() {
  for (const player of players) {
    const inputs = inputsMap[player.id];

    if (inputs?.up) {
      player.y -= SPEED;
    }
    if (inputs?.down) {
      player.y += SPEED;
    }
    if (inputs?.left) {
      player.x -= SPEED;
    }
    if (inputs?.right) {
      player.x += SPEED;
    }
  }

    io.emit("players", players);
}

let players = [];
const inputsMap = {};

async function main() {
  const map2D = await loadMap();
  io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    inputsMap[socket.id] = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    players.push({
      id: socket.id,
      x: 0,
      y: 0,
    });

    socket.emit("map", map2D);

    socket.on("inputs", (inputs) => {
      inputsMap[socket.id] = inputs;
    });
    
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
        players.splice(players.findIndex((p) => p.id === socket.id), 1);
        delete inputsMap[socket.id];
    });
});

  app.use(express.static("public"));

  httpServer.listen(5000);

  setInterval(tick, 1000 / TICK_RATE);
}

main();
