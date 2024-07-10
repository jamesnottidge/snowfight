const tmx = require("tmx-parser");

const loadMap = async () => {
  const map = await new Promise((resolve, reject) => {
    tmx.parseFile("./src/map.tmx", function (err, map) {
      if (err) return reject(err);
      resolve(map);
    });
  });

  const layer = map.layers[0];
  const groundTiles = layer.tiles;
  const decalTiles = map.layers[1].tiles;
  const ground2D = [];
  const decal2D = [];

  for (let row = 0; row < map.height; row++) {
    const groundTileRow = [];
    const decalTileRow = [];

    for (let col = 0; col < map.width; col++) {
      const groundTile = groundTiles[row * map.height + col];
      const decalTile = decalTiles[row * map.height + col];
      if (decalTile) {
        decalTileRow.push({ id: groundTile.id, gid: groundTile.gid });
      } else {
        decalTileRow.push(undefined);
      }
      groundTileRow.push({ id: groundTile.id, gid: groundTile.gid });
    }
    ground2D.push(groundTileRow);
    decal2D.push(decalTileRow);
  }
  return{
    ground2D,
    decal2D,
  }
};

module.exports = loadMap;
