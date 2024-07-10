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
const SNOWBALL_SPEED = 10;
const PLAYER_SIZE = 16;

function tick(delta) {
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

  for (const snowball of snowballs) {
    snowball.x += Math.cos(snowball.angle) * SNOWBALL_SPEED;
    snowball.y += Math.sin(snowball.angle) * SNOWBALL_SPEED;
    snowball.timeLeft -= delta;

    for (const player of players) {
        const distance = Math.sqrt((player.x + PLAYER_SIZE/2 - snowball.x) ** 2 + (player.y + PLAYER_SIZE/2 - snowball.y) ** 2);
        if (distance <= PLAYER_SIZE/2 && player.id !== snowball.playerId) {
            player.x = 0;
            player.y = 0;
            snowball.timeLeft = -1;
            break;
        }
    }

  }


snowballs = snowballs.filter(snowball => snowball.timeLeft > 0); 

  io.emit("players", players);
  io.emit("snowballs", snowballs);
}

let players = [];
let snowballs = [];
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

    socket.on("snowball", (angle) => {
      const player = players.find((player) => player.id === socket.id);
      snowballs.push({
        playerId: socket.id,
        x: player.x,
        y: player.y,
        timeLeft: 1000,
        angle,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
      players.splice(
        players.findIndex((p) => p.id === socket.id),
        1
      );
      delete inputsMap[socket.id];
    });
  });

  app.use(express.static("public"));

  httpServer.listen(5000);
  let lastUpdate = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delta = now - lastUpdate;
    lastUpdate = now;
    tick(delta);
  }, 1000 / TICK_RATE);
}

main();
