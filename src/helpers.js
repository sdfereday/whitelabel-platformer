export const useState = state => [
    () => state,
    modifiedState => (state = modifiedState)
];