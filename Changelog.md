### 0.1.1

2015.6.8

- all async methods now use promises not callbacks (`tweenPan`, `tweenGain`)

  ```
  track.tweenPan(0, 1000)
  .then(function(track){ mix.removeTrack(track.name) })
  ```

- `removeTrack()` now takes a track or a track name as an argument

### 0.1.0

- first tagged release