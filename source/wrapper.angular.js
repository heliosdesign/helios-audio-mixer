(function(window, angular, undefined) {'use strict';

angular.module('heliosAudioMixer', ['ng'])
    .factory('audioMixer', function($window, $rootScope) {

        %%% REPLACE %%%

        var Mixer = new Mix();

        return Mixer;
            
    });

})(window, window.angular);