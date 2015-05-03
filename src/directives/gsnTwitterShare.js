(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnTwitterShare', ['$timeout', function ($timeout) {
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
      var defaults = {
        count: 'none'
      };
      
      function loadShare() {
        if (typeof twttr !== "undefined" && twttr !== null) {
          var options = scope.$eval(attrs.gsnTwitterShare);
          angular.extend(defaults, options);
          twttr.widgets.createShareButton(
            attrs.url,
            element[0],
            function(el) {
            }, defaults
          );
        } else {
          $timeout(loadShare, 500);
        }
      }

      $timeout(loadShare, 500);
    }
  }]);

})(angular);