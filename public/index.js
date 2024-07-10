const mapImage = new Image();
mapImage.src = "./tileset_basic_terrain.png";
const cartmanImage = new Image();
cartmanImage.src = "./cartman-image.webp";

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");


const socket = io(`ws://localhost:5000`);

socket.on("connect", () => {
    console.log("Connected to server");
});



let map = [[]];
let players = [];


socket.on("map", (loadedMap) => { 
    console.log(map);
    map = loadedMap;
});

socket.on("players", (serverPlayers) => {
    players = serverPlayers; 
});

const inputs = {
    up: false,
    down: false,
    left: false,
    right: false
};


window.addEventListener("keydown", (event) => {

    if (event.key === "ArrowUp" || event.key === "w") {
        inputs.up = true;
    }
    if (event.key === "ArrowDown" || event.key === "s") {
        inputs.down = true;
    }
    if (event.key === "ArrowLeft" || event.key === "a") {
        inputs.left = true;
    }
    if (event.key === "ArrowRight"  || event.key === "d") {
        inputs.right = true;
    }
    socket.emit("inputs", inputs);

});

window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowUp"  || event.key === "w") {
        inputs.up = false;
    }
    if (event.key === "ArrowDown" || event.key === "s") {
        inputs.down = false;
    }
    if (event.key === "ArrowLeft" || event.key === "a") {
        inputs.left = false;
    }
    if (event.key === "ArrowRight" || event.key === "d") {
        inputs.right = false;
    }
    socket.emit("inputs", inputs);

});


const TILE_SIZE = 16;
const TILES_IN_ROW = 12;



function loop () {
    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);
    for(let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            const tile = map[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;
            const imageRow = parseInt(tile.id / TILES_IN_ROW);
            const imageCol = tile.id % TILES_IN_ROW;
            canvas.drawImage(
                mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                x,
                y,
                TILE_SIZE,
                TILE_SIZE
            );
        };
    }

    for (const player of players) {
        canvas.drawImage(cartmanImage, player.x, player.y, 16, 16);
    }


    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);