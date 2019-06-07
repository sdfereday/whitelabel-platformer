export const useState = state => [
    () => state,
    modifiedState => (state = modifiedState)
];

export const preloader = (data = [], loaderFn = args => { }) =>
    data.map(({ args }) => loaderFn(args))