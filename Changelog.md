### 0.1

2015.6.8

- started using semver

- all async methods now use promises not callbacks (`tweenPan`, `tweenGain`)

  ```
  track.tweenPan(0, 1000)
  .then(function(track){ mix.removeTrack(track.name) })
  ```

- `removeTrack()` now takes a track or a track name as an argument

