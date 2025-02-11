const express = require("express");
const { createServer } = require("http");
const { resolve } = require("path");

const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;

const io = new Server(httpServer);
const loadMap = require("./mapLoader");

const TICK_RATE = 30;
const SPEED = 5;
const SNOWBALL_SPEED = 10;
const PLAYER_SIZE = 16;
const TILE_SIZE = 16; 

let players = [];
let snowballs = [];
const inputsMap = {};
let ground2D, decal2D;

function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
    
}

function isCollidingWithMap(player) {
    for (let row = 0; row < decal2D.length; row++) {
        for (let col = 0; col < decal2D[row].length; col++) {
            const tile = decal2D[row][col]; 
            if (tile && isColliding(
                {
                    ...player, width: PLAYER_SIZE, height: PLAYER_SIZE
                }, 
                {
                    x: col * TILE_SIZE,
                    y: row * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE
                }
            )){
                return true;
            }
            
        }
    }
    return false; 
}


function tick(delta) {
  for (const player of players) {
    const inputs = inputsMap[player.id];
const previousY = player.y;
const previousX = player.x;
    if (inputs?.up) {
      player.y -= SPEED;
    }
    if (inputs?.down) {
      player.y += SPEED;
    }

    if (isCollidingWithMap(player)) {
        player.y = previousY;
    }

    if (inputs?.left) {
      player.x -= SPEED;
    }
    if (inputs?.right) {
      player.x += SPEED;
    }
    if (isCollidingWithMap(player)) {
        player.x = previousX;
    } 
  }

  for (const snowball of snowballs) {
    snowball.x += Math.cos(snowball.angle) * SNOWBALL_SPEED;
    snowball.y += Math.sin(snowball.angle) * SNOWBALL_SPEED;
    snowball.timeLeft -= delta;

    for (const player of players) {
      const distance = Math.sqrt(
        (player.x + PLAYER_SIZE / 2 - snowball.x) ** 2 +
          (player.y + PLAYER_SIZE / 2 - snowball.y) ** 2
      );
      if (distance <= PLAYER_SIZE / 2 && player.id !== snowball.playerId) {
        player.x = 0;
        player.y = 0;
        snowball.timeLeft = -1;
        break;
      }
    }
  }

  snowballs = snowballs.filter((snowball) => snowball.timeLeft > 0);

  io.emit("players", players);
  io.emit("snowballs", snowballs);
}


     
async function main() {
  ({ ground2D, decal2D } = await loadMap());
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

    socket.emit("map", {
      ground: ground2D,
      decal: decal2D,
    });

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

  httpServer.listen(PORT); 
  let lastUpdate = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delta = now - lastUpdate;
    lastUpdate = now;
    tick(delta);
  }, 1000 / TICK_RATE);
}

main();
