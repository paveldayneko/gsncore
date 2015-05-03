(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive("gsnPopover", ['$window', '$interpolate', '$timeout', function ($window, $interpolate, $timeout) {
    // Usage:   provide mouse hover capability
    // 
    // Creates: 2014-01-16
    // 
    var directive = {
      link: link,
      restrict: 'AE'
    };
    return directive;

    function link(scope, element, attrs) {
      var text = '',
          title = attrs.title || '';

      // wait until finish interpolation
      $timeout(function () {
        text = angular.element(attrs.selector).html() || '';
      }, 50);

      element.qtip({
        content: {
          text: function () {
            var rst = $interpolate('<div>' + text + '</div>')(scope).replace('data-ng-src', 'src');
            return rst;
          },
          title: function () {
            var rst = $interpolate('<div>' + title + '</div>')(scope).replace('data-ng-src', 'src');
            return (rst.replace(/\s+/gi, '').length <= 0) ? null : rst;
          }
        },
        style: {
          classes: attrs.classes || 'qtip-light qtip-rounded qtip-shadow'
        },
        show: {
          event: 'click mouseover',
          solo: true
        },
        hide: {
          distance: 1500
        },
        position: {
          // my: 'bottom left', 
          at: 'bottom left'
        }
      });

      scope.$on("$destroy", function () {
        element.qtip('destroy', true); // Immediately destroy all tooltips belonging to the selected elements
      });
    }
  }]);
})(angular);