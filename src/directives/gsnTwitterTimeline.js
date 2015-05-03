(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnTwitterTimeline', ['$timeout', function ($timeout) {
    // Usage:   display twitter timeline
    // 
    // Creates: 2014-01-06
    // 
    var directive = {
      link: link,
      restrict: 'A'
    };
    return directive;

    function link(scope, element, attrs) {

      element.html('<a class="twitter-timeline" href="' + attrs.href + '" data-widget-id="' + attrs.gsnTwitterTimeline + '">' + attrs.title + '</a>');

      function loadTimeline() {
        if (typeof twttr !== "undefined" && twttr !== null) {
          twttr.widgets.load();
        } else {
          $timeout(loadTimeline, 500);
        }
      }

      $timeout(loadTimeline, 500);
    }
  }]);

})(angular);