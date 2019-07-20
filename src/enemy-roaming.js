import Phaser from "phaser";
import { useState } from "./helpers";

export default ({ scene, x, y }) => {
    /// SETUP
    const { anims, matter, events, time, matterCollision } = scene;
    const [isDestroyed, setIsDestroyed] = useState(false);

    // Create the physics-based sprite that we will move around and animate
    const sprite = matter.add.sprite(0, 0, "player", 0);
    const { width: w, height: h } = sprite;

    const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules

    const mainBody = Bodies.rectangle(0, 0, w * 0.6, h, {
        chamfer: { radius: 10 } // Prevents ghost collisions between tiles
    });

    const sensors = {
        bottom: Bodies.rectangle(0, h * 0.5, w * 0.25, 2, { isSensor: true }),
        left: Bodies.rectangle(-w * 0.35, 0, 2, h * 0.5, { isSensor: true }),
        right: Bodies.rectangle(w * 0.35, 0, 2, h * 0.5, { isSensor: true }),
        bottomRight: Bodies.rectangle(w * 2, 0, w, h, { isSensor: true }) // Wot
    };

    const compoundBody = Body.create({
        parts: [
            mainBody,
            sensors.bottom,
            sensors.left,
            sensors.right,
            sensors.bottomRight
        ],
        frictionStatic: 0,
        frictionAir: 0.02,
        friction: 0.1
    });

    // Track which sensors are touching something
    const [isTouchingLeft, setIsTouchingLeft] = useState(false);
    const [isTouchingRight, setIsTouchingRight] = useState(false);
    const [isTouchingGround, setIsTouchingGround] = useState(false);

    // For AI
    const [isTouchingBR, setIsTouchingBR] = useState(false);

    const resetTouching = () => {
        setIsTouchingLeft(false)
        setIsTouchingRight(false)
        setIsTouchingGround(false)
        setIsTouchingBR(false)
    }

    /// METHODS
    const onSensorCollide = ({ bodyA, bodyB, pair }) => {
        // Watch for the player colliding with walls/objects on either side and the ground below, so
        // that we can use that logic inside of update to move the player.
        // Note: we are using the "pair.separation" here. That number tells us how much bodyA and bodyB
        // overlap. We want to teleport the sprite away from walls just enough so that the player won't
        // be able to press up against the wall and use friction to hang in midair. This formula leaves
        // 0.5px of overlap with the sensor so that the sensor will stay colliding on the next tick if
        // the player doesn't move.
        if (bodyB.isSensor) return; // We only care about collisions with physical objects
        if (bodyA === sensors.left) {
            setIsTouchingLeft(true);
            if (pair.separation > 0.5) sprite.x += pair.separation - 0.5;
        } else if (bodyA === sensors.right) {
            setIsTouchingRight(true);
            if (pair.separation > 0.5) sprite.x -= pair.separation - 0.5;
        } else if (bodyA === sensors.bottom) {
            setIsTouchingGround(true);
        }

        // AI (checks run independantly)
        if(bodyA === sensors.bottomRight) {
            setIsTouchingBR(true);
        }
    }

    const update = () => {
        if (isDestroyed()) return;

        const velocity = sprite.body.velocity;
        const isOnGround = isTouchingGround();

        // --- Move the player horizontally ---
        // Adjust the movement so that the player is slower in the air
        //const moveForce = isOnGround ? 0.009 : 0.005;
        const directMoveForce = isOnGround ? 3 : 3;

        // Similar to input, but instead run ai logic
        // if (isLeftKeyDown) {
        //     sprite.setFlipX(true);

        //     // Don't let the player push things left if they in the air
        //     if (!(isInAir && isTouchingLeft())) {
        //         //sprite.applyForce({ x: -moveForce, y: 0 });
        //         sprite.setVelocityX(-directMoveForce)
        //     }
        // } else if (isRightKeyDown) {
        //     sprite.setFlipX(false);

        //     // Don't let the player push things right if they in the air
        //     if (!(isInAir && isTouchingRight())) {
        //         //sprite.applyForce({ x: moveForce, y: 0 });
        //         sprite.setVelocityX(directMoveForce)
        //     }
        // }
        if (isTouchingBR()) {
            console.log(1);
        }

        // Limit horizontal speed, without this the player's velocity would just keep increasing to
        // absurd speeds. We don't want to touch the vertical velocity though, so that we don't
        // interfere with gravity.
        if (velocity.x > directMoveForce) sprite.setVelocityX(directMoveForce);
        else if (velocity.x < -directMoveForce) sprite.setVelocityX(-directMoveForce);

        // Update the animation/texture based on the state of the player's state
        if (isOnGround) {
            if (sprite.body.velocity.x !== 0) sprite.anims.play("player-run", true);
            else sprite.anims.play("player-idle", true);
        } else {
            // TODO: How about a sommersault on double jump? :o (just the animation, leave the body alone)
            sprite.anims.stop();
            sprite.setTexture("player", 10);
        }
    }

    const destroy = () => {
        // Clean up any listeners that might trigger events after the player is officially destroyed
        events.off("update", update, this);
        events.off("shutdown", destroy, this);
        events.off("destroy", destroy, this);

        if (matter.world) {
            matter.world.off("beforeupdate", resetTouching, this);
        }

        const collisionsToRemove = [
            sensors.bottom,
            sensors.left,
            sensors.right
        ];

        matterCollision.removeOnCollideStart({ objectA: collisionsToRemove });
        matterCollision.removeOnCollideActive({ objectA: collisionsToRemove });

        setIsDestroyed(true);
        sprite.destroy();
    }

    /// INITIALIZE
    setIsDestroyed(false);
    events.on("update", update, this);
    events.once("shutdown", destroy, this);
    events.once("destroy", destroy, this);

    sprite
        .setExistingBody(compoundBody)
        .setScale(2)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setPosition(x, y);

    // Before matter's update, reset the player's count of what surfaces it is touching.
    matter.world.on("beforeupdate", resetTouching, this);

    matterCollision.addOnCollideStart({
        objectA: [sensors.bottom, sensors.left, sensors.right],
        callback: onSensorCollide,
        context: this
    });
    matterCollision.addOnCollideActive({
        objectA: [sensors.bottom, sensors.left, sensors.right],
        callback: onSensorCollide,
        context: this
    });

    // Create the animations we need from the player spritesheet
    anims.create({
        key: "player-idle",
        frames: anims.generateFrameNumbers("player", { start: 0, end: 3 }),
        frameRate: 3,
        repeat: -1
    });
    anims.create({
        key: "player-run",
        frames: anims.generateFrameNumbers("player", { start: 8, end: 15 }),
        frameRate: 12,
        repeat: -1
    });

    /// PUBLIC
    return {
        sprite,
        freeze: () => sprite.setStatic(true),
        update: () => update(),
        destroy: () => destroy()
    }
}