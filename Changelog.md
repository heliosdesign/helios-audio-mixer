# Changelog

## 1.0.0-alpha.3

- upgrades to dependencies and wepback/babel configuration
- completed integration of analysis node functionality, including demo and tests
- assorted file cleanup and standardisation

## 1.0.0-alpha.2

- web audio API tracks added: buffer source track, element source track
- demo functionality improvements

## 1.0.0-alpha.1

- complete rewrite in ES7/2015 to be more modular, easily extensible, and testable
- all dependencies removed, this library will be completely standalone
- HTML5 track only for now, buffer source in next release

## 0.4.5

- fixed a bug where audio analysis would stop a few seconds into the track
- audio analysis is now triggered externally, by calling `track.getAnalysis()`

## 0.4.4

- fixed a bug where an element source track wouldn’t set gain properly
- more accurately reporting gain
- using tween.js again for element source tracks

## 0.4.3

- fixes

## 0.4.2

- removed `.browserify.js` file
- analysis works again
- unit tests for analysis
- buffer source tracks no longer trigger ended event when looping (for consistency with element source tracks)
- calling `track.play()` before the media file is loaded now tells the track to play when loaded instead of failing silently

## 0.4.1

- separate minified js files (`.min.js`)

## 0.4.0

- Popcorn-style events
- `mix.updateTween()` &rarr; `mix.update()`
- `new heliosAudioMixer()` &rarr; `new HeliosAudioMixer()`

## 0.3.2

- `track.one()` no longer remove other callbacks for the same event type

## 0.3.1

fixes

## 0.3.0

- Refactor
- Unit Tests (Karma + Chai)
- `track.options.looping` &rarr; `track.options.loop`
- `track.tweenPan()` now uses `linearRampToValueAtTime()`

## 0.2.0

- audio analysis
- refactored into separate modules using Browserify

### 0.1.3

misc fixes

### 0.1.2

fixed `removeTrack()` memory leak

## 0.1.1

2015.6.8

- all async methods now use promises not callbacks (`tweenPan`, `tweenGain`)

  ```js
  track.tweenPan(0, 1000)
  .then(function(track){ mix.removeTrack(track.name) })
  ```

- `removeTrack()` now takes a track or a track name as an argument

### 0.1.0

- first tagged release
