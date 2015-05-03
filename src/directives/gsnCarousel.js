(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnCarousel', ['gsnApi', '$timeout', '$window', function (gsnApi, $timeout, $window) {
    // Usage:   Display slides
    // 
    // Creates: 2014-01-06
    // 
    var directive = {
      link: link,
      restrict: 'EA',
      scope: true
    };
    return directive;

    function link(scope, element, attrs) {
      var options = {
        interval: attrs.interval,
        reverse: attrs.reverse | false
      },
      cancelRefresh,
      wasRunning = false,
      isPlaying = false;
      
      scope.$slideIndex = 0;
      scope.activate = activate;
      scope.slides = [];
      
      // determine if slide show is current playing
      scope.isPlaying = function() {
        return isPlaying;
      };
      
      // play slide show
      scope.play = function() {
        isPlaying = true;
        
        slideTimer();
      };
      
      // pause slide show
      scope.stop = function() {
        isPlaying = false;
        
        if (gsnApi.isNull(cancelRefresh, null) !== null) {
          $timeout.cancel(cancelRefresh);
        }
      };
      
      // go to next slide
      scope.next = function() {
        scope.$slideIndex = doIncrement(scope.$slideIndex, 1);
      };
      
      // go to previous slide
      scope.prev = function() {
        scope.$slideIndex = doIncrement(scope.$slideIndex, -1);
      };

      // go to specfic slide index
      scope.selectIndex = function(slideIndex) {
        scope.$slideIndex = slideIndex;
      };

      // get the current slide
      scope.currentSlide = function() {
        return scope.slides[scope.currentIndex()];
      };
      
      // add slide
      scope.addSlide = function(slide) {
        scope.slides.push(slide);
      };

      // remove a slide
      scope.removeSlide = function(slide) {
        //get the index of the slide inside the carousel
        var index = scope.indexOf(slide);
        slides.splice(index, 1);
      };

      // get a slide index
      scope.indexOf = function (slide) {
        if (typeof(slide.indexOf) !== 'undefined') {
          return slide.indexOf(slide);
        }
        else if (typeof (scope.slides.length) != 'undefined') {
          // this is a loop because of indexOf does not work in IE
          for (var i = 0; i < scope.slides.length; i++) {
            if (scope.slides[i] == slide) {
              return i;
            }
          }
        }

        return -1;
      };
      
      // get current slide index
      scope.currentIndex = function () {
        var reverseIndex = (scope.slides.length - scope.$slideIndex - 1) % scope.slides.length;
        reverseIndex = (reverseIndex < 0) ? 0 : scope.slides.length - 1;
        
        return options.reverse ? reverseIndex : scope.$slideIndex;
      };
      
      // watch index and make sure it doesn't get out of range
      scope.$watch('$slideIndex', function(newValue) {
        var checkValue = doIncrement(scope.$slideIndex, 0);
        
        // on index change, make sure check value is correct
        if (checkValue != newValue) {
          scope.$slideIndex = checkValue;
        }
      });
      
      // cancel timer if it is running
      scope.$on('$destroy', scope.stop);
      
      scope.activate();
      
      //#region private functions
      // initialize
      function activate() {
        if (gsnApi.isNull(scope[attrs.slides], []).length <= 0) {
          $timeout(activate, 200);
          return;
        }
        
        isPlaying = gsnApi.isNull(options.interval, null) !== null;
        scope.slides = scope[attrs.slides];
        scope.selectIndex(0);
        
        // trigger the timer
        slideTimer();
        var win = angular.element($window);
        win.blur(function() {
          wasRunning = scope.isPlaying();
          scope.stop();
        });
        
        win.focus(function() {
          if (wasRunning) {
            scope.play();
          }
        });
      }

      // the slide timer
      function slideTimer() {
        if (!isPlaying) {
          return;
        }
        
        cancelRefresh = $timeout(function doWork() {
          if (!isPlaying) {
            return;
          }

          scope.next();
          
          // set new refresh interval
          cancelRefresh = $timeout(doWork, options.interval);
          
          // empty return to further prevent memory leak
          return;
        }, options.interval);
      }
      
      // safe increment
      function doIncrement(slideIndex, inc) {
        var newValue = slideIndex + inc;
        newValue = ((newValue < 0) ? scope.slides.length - 1 : newValue) % scope.slides.length;
        return gsnApi.isNaN(newValue, 0);
      }
      //#endregion
    }
  }]);
})(angular);