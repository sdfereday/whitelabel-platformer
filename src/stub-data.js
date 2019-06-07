export const testScene = {
  tilemaps: [
    {
      args: ["map", "../assets/tilemaps/level.json"]
    }
  ],
  images: [
    {
      args: ["kenney-tileset-64px-extruded", "../assets/tilesets/kenney-tileset-64px-extruded.png"]
    },
    {
      args: ["wooden-plank", "../assets/images/wooden-plank.png"]
    },
    {
      args: ["block", "../assets/images/block.png"]
    }
  ],
  spriteSheets: [
    {
      args: [
        "player",
        "../assets/spritesheets/0x72-industrial-player-32px-extruded.png",
        {
          frameWidth: 32,
          frameHeight: 32,
          margin: 1,
          spacing: 2
        }
      ]
    }
  ],
  atlases: [
    {
      args: [
        "emoji",
        "../assets/atlases/emoji.png",
        "../assets/atlases/emoji.json"
      ]
    }
  ],
  mapData: {
    useTilemap: "map",
    useTileset: "kenney-tileset-64px-extruded",
    mapLayers: [
      {
        name: "Ground",
        depth: -1,
        collides: true
      },
      {
        name: "Lava",
        depth: -1,
        collides: true
      },
      {
        name: "Background",
        depth: -1,
        collides: false
      },
      {
        name: "Foreground",
        depth: 10,
        collides: false
      }
    ]
  }
}