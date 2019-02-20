# Audio Mixer Dev Notes

## tooling

`npm test` runs ava (unit tests) in watch mode. Tests are run on uncompiled source files, so no webpack is required.

`npm start` runs webpack in watch mode, and opens a web server for the demo.

`npm run dist` compiles a minified build.

## Links

- [Web Audio API performance and debugging notes](https://padenot.github.io/web-audio-perf/)
