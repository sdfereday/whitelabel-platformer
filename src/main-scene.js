import Phaser from "phaser";
import Player from "./player";
import { makeMap } from "./map-methods";
import { testScene } from "./stub-data";
import { preloader } from "./helpers";
import {
  onLethalTile,
  onPlayerWin,
  registerOnLethalEvents,
  registerOnSceneCompleteEvents
} from "./scene-events";

export default class MainScene extends Phaser.Scene {
  preload() {
    const { tilemaps, images, spriteSheets, atlases } = testScene
    preloader(tilemaps, args => this.load.tilemapTiledJSON(...args));
    preloader(images, args => this.load.image(...args));
    preloader(spriteSheets, args => this.load.spritesheet(...args));
    preloader(atlases, args => this.load.atlas(...args));
  }

  create() {
    const { mapData } = testScene;
    const { map, sceneGoalSensor } = makeMap(this, mapData);

    // The spawn point is set using a point object inside of Tiled (within the "Spawn" object layer)
    const { x, y } = map.findObject("Spawn", obj => obj.name === "Spawn Point");
    const player = Player({
      scene: this,
      x,
      y
    });

    /// Camera and world physics bounds
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(player.sprite, false, 0.5, 0.5);

    /// Collision events that determine a major outcome for this scene
    const onLethalTileEvent = this.matterCollision.addOnCollideStart({
      objectA: player.sprite,
      callback: ({ gameObjectB: tile }) => {
        if (!tile || !(tile instanceof Phaser.Tilemaps.Tile)) return;

        // Check the tile property set in Tiled (you could also just check the index if you aren't using
        // Tiled in your game)
        if (tile.properties.isLethal) {
          // Perform whatever effect / thing you want to happen (pass scene so we can effect things)
          onLethalTile({ sceneContext: this, player })
        }
      },
      context: this
    });

    const onSceneCompleteEvent = this.matterCollision.addOnCollideStart({
      objectA: player.sprite,
      objectB: sceneGoalSensor,
      callback: () => {
        // Perform whatever effect / thing you want to happen (pass scene so we can effect things)
        onPlayerWin({ sceneContext: this, player })
      },
      context: this
    });

    // Register events to the scene events area
    registerOnLethalEvents([onLethalTileEvent]);
    registerOnSceneCompleteEvents([onSceneCompleteEvent]);
  }
}
