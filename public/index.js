const mapImage = new Image();
mapImage.src = "./tileset_basic_terrain.png";

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");


const socket = io(`ws://localhost:5000`);

socket.on("connect", () => {
    console.log("Connected to server");
});



let map = [[]];
socket.on("map", (loadedMap) => { 
    console.log(map);
    map = loadedMap;
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
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);