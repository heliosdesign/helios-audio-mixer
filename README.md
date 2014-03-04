**Bower** `helios-audio-mixer`

# Web Audio Mixer

Javascript audio multi-track mixer library. Optimally uses the web audio API ([caniuse](http://caniuse.com/audio-api)), but gracefully degrades to HTML5.

[WC3: Web Audio API](http://www.w3.org/TR/webaudio/)

[MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web_Audio_API
)

### Dependencies

- [tween.js](https://github.com/sole/tween.js/) (but works without it too)
- [heliosFrameRunner](https://github.com/heliosdesign/helios-frame-runner) (not _really_ a dependency, but recommended for managing `requestAnimationFrame`)

### Props

…to Kevin Ennis for his excellent [Mix.js](https://github.com/kevincennis/Mix.js). We based this library on Mix.js when we started working with the web audio API a couple years ago.

## How to use


#### Basic

```
var Mixer = new heliosAudioMixer();

Mixer.createTrack('track1', { source: 'audio/file' });

Mixer.getTrack(']track1').gain(0.5);

Mixer.getTrack('track1').tweenGain(0, 1000, function(){
	Mixer.getTrack('track1').stop();
});

```


#### Groups

Work with groups of tracks using `getTracks()`.

```
Mixer.createTrack('meow', {
	source:   'audio/meow',
	group:    'cats',
	autoplay:  false
})

Mixer.createTrack('hiss', {
	source:   'audio/hiss',
	group:    'cats',
	autoplay:  false		
})

Mixer.createTrack('hown', {
	source:   'audio/howl',
	group:    'dogs',
	autoplay:  true
})

function cats(){
	Mixer.getTracks('dogs').tweenGain(0, 1000, function(){
		Mixer.getTracks('dogs').pause();
		Mixer.getTracks('cats').play();		
	})
}

```


## Reference

### Detect Object

```
Detect = {
	webAudio:    true/false,
	nodes:     { gain, gainNode, panner, convolver, delay, delayNode, compressor },
	audioType:  .m4a/.ogg/.mp3,
	videoType:  .webm/.mp4/.ogv,
	tween:       true/false		
}
```

### Mixer Methods

##### Events

- `on('event',function)` events: see below
- `off('event')`

##### Track Management

- `createTrack(name, opts)` see below for `opts`
- `removeTrack(name)`
- `removeTracks(group/*)`
- `getTrack(name)`
- `getTracks(group/*)`

##### Globals

- `pause()`
- `play()`
- `mute()`
- `unmute()`
- `setGain(0-1)`

##### Utilities

- `updateTween()` **IMPORTANT:** call this (or `TWEEN.update()`) using rAF for tweens to work
- `setLogLvl()` 0 none, 1 minimal, 2 all (spammy)

### Track/Group Methods

`Mix.getTrack('name').method()` ← access a single track
`Mix.getTracks('group').method()` ← access a group

##### Events

- `on('event',function)`
- `off('event')`

##### Control

- `play()`
- `pause()`
- `stop()`

##### Pan

- `pan(angle)` stereo pan: angle can be a number in degrees (0° front, counts clockwise: 90° is right) or a string: `'front'`, `'back'`, `'left'`, `'right'`
- `tweenPan(angle, duration, callback)`

##### Gain

- `gain(setTo)` range 0-1
- `tweenGain(setTo, duration, callback)`
- `mute()`
- `unmute()`

##### Time

- `currentTime()` returns current time in seconds
- `formattedTime()` returns ie "00:23/00:45"
- `duration()` returns track duration in seconds


### Track Options

name | default | notes
---------|---------|---------
source       | `null`     | path to audio source (without file extension)
nodes        | `[]`      | array of strings: names of desired additional audio nodes
gain         | `0`        | initial/current gain (0-1)
pan          | `0`        | stereo pan (in degrees, clockwise, 0 is front)
start        | `0`        | start time in seconds
currentTime  | `0`        | current time (cached for resuming from pause)
looping      | `false`    | 
autoplay     | `true`     | play immediately on load
muted        | `false`    | 

#### Track Events

`remove`, `load`, `end`, `play`, `pause`, `stop`, `pan`, `gain`

```
mix.getTrack('name').on('eventType',function(){
	// do!
});
mix.getTrack('name').off('eventType');
```

#### Props

to Kevin Ennis for his excellent [Mix.js](https://github.com/kevincennis/Mix.js), which we based this library on when we started working on this web audio stuff a couple years ago.


