
## 0.4.1

- removed `.browserify.js` file
- analysis works again
- unit tests for analysis
- buffer source tracks no longer trigger ended event when looping (for consistency with element source tracks)
- calling `track.play()` before the media file is loaded now tells the track to play when loaded instead of failing silently

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

  ```
  track.tweenPan(0, 1000)
  .then(function(track){ mix.removeTrack(track.name) })
  ```

- `removeTrack()` now takes a track or a track name as an argument

### 0.1.0

- first tagged release