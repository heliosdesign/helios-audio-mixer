**Bower** `helios-audio-mixer`

# Web Audio Mixer

Javascript audio multi-track mixer library. Optimally uses the web audio API ([caniuse](http://caniuse.com/audio-api)), but gracefully degrades to HTML5.

#### Contents

- Dependencies
- How To Use
	- Basic
	- Groups
- Reference
	- Mixer Methods
	- Track/Group Methods
	- Track Options
	- Track Events
- HTML5 Mode


### Dependencies

- [heliosFrameRunner](https://github.com/heliosdesign/helios-frame-runner) (not _really_ a dependency, but recommended for managing `requestAnimationFrame`)
- [tween.js](https://github.com/sole/tween.js/) (recommended, but works without it)
- [Bowser](https://github.com/ded/bowser) (recommended, but works without it)

### Props

…to Kevin Ennis for his excellent [Mix.js](https://github.com/kevincennis/Mix.js). We based this library on Mix.js when we started working with the web audio API a couple years ago.

## How to use


#### Basic

```
var Mixer = new heliosAudioMixer();

// A) buffer source mode
Mixer.createTrack('track1', { source: 'path/to/audio/file' }); // note no file extension

// OR B) pre-existing media element source mode
Mixer.createTrack('track1', { source: document.querySelector('#mediaElement') });

Mixer.getTrack('track1').gain(0.5).pan(180); // setters are chainable!

Mixer.getTrack('track1').tweenGain(0, 1000, function(){
	Mixer.getTrack('track1').stop();
});

```

Remember to add `TWEEN.update()` to your requestAnimationFrame function.

#### Source Types

Tracks use buffer source by default. Use HTML5 element source for a track by setting the `sourceMode` option (an out-of-DOM `<audio>` element will be created), or setting the `source` option to an existing HTML5 media element instead of a string.

```

Mixer.createTrack('elementSourceTrack', {
	source: 'path/to/audio/file',
	sourceMode: 'element'
})

Mixer.createTrack('inDOMelementSourceTrack', {
	source: document.queryselector('audio#elementSourceTrack')
})

```


## Reference

### Feature Detection

Access/override/whatever through `Mixer.detect`.

```
Detect = {
	webAudio:    true | false
	audioTypes: [ 'mp3', 'm4a', 'ogg' ] // in order of preference
	videoType:  { '.webm' | '.mp4' | '.ogv' },
	bowser:     bowser.js | fallback // browser detection
	tween:      true | false
}
```

### Mixer Options

`new heliosAudioMixer( options{} )`

name | default | notes
---------|---------|---------
audioTypes | `[ 'mp3', 'm4a', 'ogg' ]` | List file types in order of preference. The first type available in the current browser will be used.
html5 | `false` | Force HTML5 mode.


### Mixer Methods

##### Track Management

- `createTrack(name, opts)` _see track options below_
- `removeTrack(name)`
- `getTrack(name)`
- `Mix.getTrack('name').method()` access a single track, chainable

##### Global Mix Control

- `pause()`
- `play()`
- `mute()`
- `unmute()`
- `gain( 0-1 )`

##### Utilities

- `setLogLvl()` 0 none, 1 minimal, 2 all (spammy)

### Track Options

name | default | notes
---------|---------|---------
source       | ``     | Path to audio source file (without file extension), OR media element to use as source
gain         | `0`        | initial/current gain (0-1)
pan          | `0`        | stereo pan (in degrees, clockwise, 0 is front)
nodes        | `[]`      | array of strings: names of desired additional audio nodes. Pan and Gain are defaults.
start        | `0`        | start time in seconds
currentTime  | `0`        | current time (cached for resuming from pause)
looping      | `false`    | 
autoplay     | `true`     | play immediately on load
muted        | `false`    | 

### Track Methods

##### Events

- `on('event',function)` _see event list below_
- `off('event')`

##### Control

- `play()`
- `pause()`
- `stop()`

##### Pan

- `pan(angle)` get/set stereo pan: angle can be a number in degrees (0° front, clockwise: 90° is right) or a string: `'front'`, `'back'`, `'left'`, `'right'`
- `tweenPan(angle, duration, callback)`

##### Gain

- `gain(setTo)` get/set gain, range 0-1
- `tweenGain(setTo, duration, callback)`
- `mute()`
- `unmute()`

If you call `gain()` while a track is muted, the value will be cached and applied upon unmuting.

##### Time

- `currentTime( setTo )` get/set current time in seconds
- `duration()` get track duration in seconds
- `formattedTime( includeDuration )` returns ie "00:23" or "00:23/00:45"



#### Track Events

name | when
:-- | :--
`remove` | removeTrack()
`load` | audio track is ready to play
`loadError` | source file couldn’t be loaded
`play` | 
`pause` | 
`stop` | 
`ended` | track reaches the end
`pan` | pan is changed
`gain` | gain is changed

```
mix.getTrack('name').on('eventType',function(){
	// do!
});
mix.getTrack('name').off('eventType');
```

## HTML5 Mode

Fallback mode for older browsers, and iOS 7. Trying to use Web Audio features like pan will fail gracefully, without errors (`return false`).

#### Tracks

In HTML5 mode, creating a track that already exists will change its source, unlike Web Audio mode where this will return an error. This allows you to circumvent the iOS requirement that media elements can only be played after a user taps 'play'—simply play all your tracks on that first tap. **NOTE** that you can only play one audio element at a time.

```
// Create all tracks at the start
Mixer.createTrack('track1', {
	source: 'a_file.mp3'
});
Mixer.createTrack('track2', {});

// on iOS play button tap
for(var i=0; i < Mixer.tracks.length; i++ ){
	Mixer.tracks[i].play();
}

// If the track’s already been created, the mixer will swap its source
Mixer.createTrack('track1', { 
	source:   'file.mp3',
	autoplay:  true
});
```

#### iOS 7

iOS 6 supports the Web Audio API and it works pretty well. iOS 7 "supports" the Web Audio API, but it’s very unstable. Web apps that worked perfectly on iOS 6 will crash in under a minute on iOS 7. Unfortunately Apple won’t allow alternative web rendering engines, so this library falls back to HTML5 on iOS 7.

#### iOS Volume Control

iOS does *not* support volume control for HTML5 audio elements. The reasoning is that the user should be able to control the volume with the OS-level volume control. Apparently in Apple-land nobody could ever possibly want to layer two tracks, or fade anything in or out, ever.
