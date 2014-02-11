## Web Audio Mixer

Javascript audio mixer library. Optimally uses the web audio API but gracefully degrades to HTML5.

Uses [tween.js](https://github.com/sole/tween.js/), but works without it too.


### How to use

Create your Mixer: `var Mixer = new Mix()`.

##### Mix Methods

- `on('event',function)`
- `off('event')`

- `createTrack(name, opts)` opts: see below
- `removeTrack(name)`
- `getTrack(name)`

- `pause()`
- `play()`
- `mute()`
- `unmute()`
- `setGain(0-1)`

- `updateTween()` **IMPORTANT:** call this (or `TWEEN.update()`) using rAF for tweens to work
- `setLogLvl()` 0 none, 1 minimal, 2 all (very spammy)

##### Track Methods

Access through `Mix.getTrack('name').<track>`.

- `on('event',function)`
- `off('event')`

- `play()`
- `pause()`
- `stop()`

- `mute()`
- `unmute()`

- `pan(angle)` stereo pan. angle can be a number in degrees or a string: `'front'`, `'back'`, `'left'`, `'right'`
- `tweenPan(angle, duration, callback)`

- `gain(setTo)` range 0-1
- `tweenGain(setTo, duration, callback)`

#### Track Options

name | default | notes
---------|---------|---------
source       | `null`     | path to audio source (without file extension)
nodes        | `[ ]`      | array of strings: names of desired additional audio nodes
gain         | `0`        | initial/current gain (0-1)
pan          | `0`        | stereo pan (in degrees, clockwise, 0 is front)
start        | `0`        | start time in seconds
currentTime  | `0`        | current time (cached for resuming from pause)
looping      | `false`    | 
autoplay     | `true`     | play immediately on load
loadCallback | `false`    | callback after track is loaded
muted        | `false`    | 


#### Props

to Kevin Ennis for his excellent [Mix.js](https://github.com/kevincennis/Mix.js), which we based this library on when we started working on this web audio stuff a couple years ago.

#### Resources

[WC3: Web Audio API](http://www.w3.org/TR/webaudio/)

[MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web_Audio_API
)

