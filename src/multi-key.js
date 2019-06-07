/**
 * A small class to allow multiple Phaser keys to treated as one input. E.g. the left arrow and "A"
 * key can be wrapped up into one "input" so that we can check whether the player pressed either
 * button.
 */
export default (scene, keys = []) => {
  const mapped = keys.map(key => scene.input.keyboard.addKey(key));

  return {
    isDown: () => mapped.some(key => key.isDown),
    isUp: () => mapped.every(key => key.isUp)
  }
}