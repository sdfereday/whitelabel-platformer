import Phaser from "phaser";
import { useState } from "./helpers";

export const unsubscribe = unsubItems =>
    unsubItems.map(u => u());

export const [onLethalEvents, registerOnLethalEvents] = useState([]);
export const [onSceneCompleteEvents, registerOnSceneCompleteEvents] = useState([]);

export const onLethalTile = ({ sceneContext, player }) => {
    // Unsubscribe from collision events so that this logic is run only once
    unsubscribe(onLethalEvents());

    // Do some camera magic and restart the scene
    const cam = sceneContext.cameras.main;
    player.freeze();
    cam.fade(250, 0, 0, 0);
    cam.once("camerafadeoutcomplete", () => sceneContext.scene.restart());
}

export const onPlayerWin = ({ sceneContext, player }) => {
    // We only need to celebrate once, so we unsub after calling
    unsubscribe(onSceneCompleteEvents());

    // Drop some heart-eye emojis, of course
    for (let i = 0; i < 35; i++) {
        const x = player.sprite.x + Phaser.Math.RND.integerInRange(-50, 50);
        const y = player.sprite.y - 150 + Phaser.Math.RND.integerInRange(-10, 10);

        sceneContext.matter.add
            .image(x, y, "emoji", "1f60d", {
                restitution: 1,
                friction: 0,
                density: 0.0001,
                shape: "circle"
            })
            .setScale(0.5);
    }
}
