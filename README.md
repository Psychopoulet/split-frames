# split-frames
Split Buffer frames from streams

[![Build Status](https://api.travis-ci.org/Psychopoulet/split-frames.svg?branch=develop)](https://travis-ci.org/Psychopoulet/split-frames)
[![Coverage Status](https://coveralls.io/repos/github/Psychopoulet/split-frames/badge.svg?branch=develop)](https://coveralls.io/github/Psychopoulet/split-frames)
[![Dependency Status](https://img.shields.io/david/Psychopoulet/split-frames/develop.svg)](https://github.com/Psychopoulet/split-frames)

## Installation

```bash
$ npm install split-frames
```

## Doc

  * inherited from [stream.Transform](https://nodejs.org/api/stream.html#stream_duplex_and_transform_streams)

## Examples

```javascript
const Spliter = require("split-frames");

stream.pipe(new Spliter({
	
}));
```

## Tests

```bash
$ mocha tests/tests.js
```

## License

[ISC](LICENSE)
