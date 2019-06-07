import Phaser from "phaser";

const createBlocks = (crateObject, matter) => {
  const { x, y, width, height } = crateObject;

  // Tiled origin for coordinate system is (0, 1), but we want (0.5, 0.5)
  matter.add
    .image(x + width / 2, y - height / 2, "block")
    .setBody({ shape: "rectangle", density: 0.001 });
}

const createRotatingPlatform = (scene, x, y, numTiles = 5) => {
  // A TileSprite is a Sprite whose texture repeats to fill the given width and height. We can use
  // this with an image from our tileset to create a platform composed of tiles:
  const { add, matter } = scene;
  const platform = add.tileSprite(
    x,
    y,
    64 * numTiles,
    18,
    "wooden-plank"
  );

  matter.add.gameObject(platform, {
    restitution: 0, // No bounciness
    frictionAir: 0, // Spin forever without slowing down from air resistance
    friction: 0.2, // A little extra friction so the player sticks better
    // Density sets the mass and inertia based on area - 0.001 is the default. We're going lower
    // here so that the platform tips/rotates easily
    density: 0.0005
  });

  // Alias the native Matter.js API
  const { Constraint } = Phaser.Physics.Matter.Matter;

  // Create a point constraint that pins the center of the platform to a fixed point in space, so
  // it can't move
  const constraint = Constraint.create({
    pointA: { x: platform.x, y: platform.y },
    bodyB: platform.body,
    length: 0
  });

  // We need to add the constraint to the Matter world to activate it
  matter.world.add(constraint);

  // Give the platform a random initial tilt, as a hint to the player that these platforms rotate
  const sign = Math.random() < 0.5 ? -1 : 1;
  const angle = sign * Phaser.Math.Between(15, 25);
  platform.setAngle(angle);
}

export const makeMap = (scene, mapData) => {
  const { make, matter } = scene;
  const { useTilemap, useTileset, mapLayers } = mapData;
  const map = make.tilemap({ key: useTilemap });
  const tileset = map.addTilesetImage(useTileset);

  mapLayers
    .map(({ name, depth, collides }) => {
      const layer = map.createDynamicLayer(name, tileset, 0, 0)

      if (depth !== -1) {
        layer.setDepth(depth)
      }

      if (collides) {
        // Set colliding tiles before converting the layer to Matter bodies
        layer.setCollisionByProperty({ collides })

        // Get the layers registered with Matter. Any colliding tiles will be given a Matter body. We
        // haven't mapped our collision shapes in Tiled so each colliding tile will get a default
        // rectangle body (similar to AP).
        matter.world.convertTilemapLayer(layer);
      }

      return layer;

    })
    .reduce((acc, cur) =>
      ({ ...acc, [cur.layer.name]: cur }), {})

  // Special map tile processing
  // Load up some crates from the "Crates" object layer created in Tiled
  map.getObjectLayer("Crates").objects.forEach(crateObject => createBlocks(crateObject, matter));

  // Create platforms at the point locations in the "Platform Locations" layer created in Tiled
  map.getObjectLayer("Platform Locations").objects.forEach(point => createRotatingPlatform(scene, point.x, point.y));

  // Create a scene goal sensor
  // Create a sensor at rectangle object created in Tiled (under the "Sensors" layer)
  const rect = map.findObject("Sensors", obj => obj.name === "Celebration");
  const sceneGoalSensor = matter.add.rectangle(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    rect.width,
    rect.height,
    {
      isSensor: true, // It shouldn't physically interact with other bodies
      isStatic: true // It shouldn't move
    }
  );

  return {
    map,
    sceneGoalSensor
  };
}
