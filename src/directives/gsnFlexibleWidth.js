(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnFlexibleWidth', ['debounce', '$window', function (debounce, $window) {
    var directive = {
      restrict: 'EA',
      scope: true,
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      function updateWidth() {
        element.css({
          width: element.parent()[0].offsetWidth + 'px'
        });
      }

      var myUpdateWith = debounce(updateWidth, 200);
      $window.on('resize', myUpdateWith);
      myUpdateWith();
    }
  }]);
})(angular);