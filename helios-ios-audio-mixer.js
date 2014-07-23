;(function(window, document, undefined) {

    // ██╗ ██████╗ ███████╗
    // ██║██╔═══██╗██╔════╝
    // ██║██║   ██║███████╗
    // ██║██║   ██║╚════██║
    // ██║╚██████╔╝███████║
    // ╚═╝ ╚═════╝ ╚══════╝

    var Mix = function(opts){

        this.debug = 1;      // 0 no logging, 1 minimal, 2 all (very spammy)

        this.log = function(msg, lvl){
            if(lvl <= this.debug) console.log(msg);
        };

        this.setLogLvl = function( lvl ){
            this.debug = constrain(lvl,0,2);
            this.log('[Mixer] Set log level: ' + lvl, 1)
            console.log(this)
        };

        this.options = {
            element: {
                audio: undefined,
                video: undefined
            },
            fileType: {
                audio: '.m4a',
                video: '.mp4'
            }
        };

        this.events  = {} // mix.on() support
        this.tweens  = {} // 

        this.tracks  = {}   // archived track options

        this.currentTrack = null // options of the currently active track
        this.element = null // reference to active element

        this.playing = false // 
        this.muted   = false // 

        // Media Elements
        // ********************************************************

        if( opts.audioElement )
            this.options.element.audio = opts.audioElement
        
        if( opts.videoElement )
            this.options.element.video = opts.videoElement

        if( typeof this.options.audioElement === 'undefined' )
            this.options.element.audio = document.createElement('audio')

        // if( typeof this.options.videoElement === 'undefined' )
        //     this.options.element.video = document.createElement('video')

        return this

    };

    
    // Copy all of the properties in the source objects to
    // the destination object, and return the destination object
    
    Mix.prototype.extend = function(){
        var output = {}
        ,   args   = arguments
        ,   l      = args.length

        for ( var i = 0; i < l; i++ )       
            for ( var key in args[i] )
                if ( args[i].hasOwnProperty(key) )
                    output[key] = args[i][key];

        return output;
    };




    // Load track metadata into mixer.tracks

    Mix.prototype.createTrack = function( id, opts ){

        if( !id || typeof id !== 'string' )
            throw new Error('Can’t save track data, invalid ID')

        if( this.tracks[id] )
            throw new Error('A track with id "'+id+'" already exists')

        if( !opts.source )
            throw new Error('Can’t create track with no source.')


        var defaults = {
            source:     null,    // source (without file extension)
            type:       'audio', // or video
            start:      0,       // start time in seconds
            loop:       false,   //
            autoplay:   true,    // play immediately on load
            autobuffer: true,    // auto download track
            events: {}
        }

        var track = this.extend.call(this, defaults, opts || {});
        track.source += this.options.fileType[ track.type ]
        
        this.tracks[id] = track

        return this
    }


    /*
        Switch
        id: ''
        target: 'audio', 'video'
    */

    Mix.prototype.load = function( id ){

        if( !id || typeof id !== 'string' )
            throw new Error('Can’t load track, invalid ID')

        if( ! this.tracks[id] )
            throw new Error('Can’t load track "'+id+'", not yet created')

        var newTrack = this.tracks[id]
        ,   oldTrack = this.currentTrack
        ,   eventTypes = [ 'canplaythrough', 'play', 'pause', 'seeked', 'error' ]


        // clear old track
        // ~~~~~~~~~~~~~~~

        if( oldTrack ){
            // remove old events
            for (var i = eventTypes.length-1; i >= 0; i--) {
                var e = eventTypes[i]

                if( oldTrack.events[ e ] )
                    this.element.removeEventListener( e, oldTrack.events[ e ] )
            };

            this.element.src = ''    
        }

        // set up new track
        // ~~~~~~~~~~~~~~~~

        this.element = this.options.element[ newTrack.type ]

        console.log(this.element)

        // add new events
        for (var i = eventTypes.length-1; i >= 0; i--) {
            var e = eventTypes[i]

            if( newTrack.events[ e ] )
                this.element.addEventListener( e, oldTrack.events[ e ], false )
        };

        this.element.autoplay   = newTrack.autoplay
        this.element.loop       = newTrack.loop
        this.element.autobuffer = newTrack.autobuffer

        this.element.src = newTrack.source
        this.currentTrack = newTrack

    }

    Mix.prototype.timeFormat = function(seconds){
        var m=Math.floor(seconds/60)<10 ? '0'+Math.floor(seconds/60):Math.floor(seconds/60);
        var s=Math.floor(seconds-(m*60))<10 ? '0'+Math.floor(seconds-(m*60)):Math.floor(seconds-(m*60));
        return m+':'+s;
    }


    window.heliosiOSAudioMixer = Mix;
    
})(window, document);