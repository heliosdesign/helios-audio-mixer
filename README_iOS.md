# iOS HTML5 Audio Manager

Single audio/video element mixer for iOS’ *severely* limited HTML5 audio implementation.

#### iOS 7

iOS 6 supports the Web Audio API and it works reasonably well. iOS 7 "supports" the Web Audio API, but it’s very unstable. Web apps that worked perfectly on iOS 6 will crash in under a minute on iOS 7. Hence this library’s existence.

#### Volume Control

iOS does *not* support volume control for HTML5 audio elements. The reasoning is, presumably, that the user should be able to control the volume with the OS-level volume control. Apparently in Apple-land nobody could ever possibly want to layer two tracks, or fade anything in or out, ever.


## How to use

```
var Mix = new heliosiOSAudioMixer();
```

Set up track data:

```
Mix.createTrack('track1', { source: 'path/to/audio-file' })

Mix.createTrack('track2', { 
	source:   'path/to/audio-file',
	type:     'video',
	start:    4.3,
	loop:     true,
	autoplay: false
})
```

Load a track into a media element:

```
Mix.load( 'track1' )
```

The mixer knows `track1` is an audio track (default), so it sets the audio element to the active element.

If `autoplay` is set, the track will automatically begin to play.

Control playback directly through `Mix.element`, a reference to the active media element (`audio` or `video`).

### Additional Methods

`Mix.timeFormat( seconds )` converts a float to the format `MM:SS`.
