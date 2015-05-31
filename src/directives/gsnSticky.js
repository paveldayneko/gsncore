(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive("gsnSticky", ['$window', '$timeout', 'debounce', function ($window, $timeout, debounce) {

    var directive = {
      link: link,
      restrict: 'A',
    };
    return directive;

    function link(scope, element, attrs) {
      var anchor = angular.element('<div class="sticky-anchor" style="display: none"></div>');
      element.before(anchor);

      if (attrs.bottom) {
        element.css({ 'bottom': parseInt(attrs.bottom) });
      }

      if (attrs.top) {
        element.css({ 'top': parseInt(attrs.top) });
      }

      function checkSticky() {
        var scrollTop = $window.scrollTop();
        var screenHight = $window.height();
        var isScticky = false;

        if (attrs.bottom) {
          isScticky = (scrollTop + screenHight < angular.element(anchor).offset().top + parseInt(attrs.bottom));
        }
        
        if (attrs.top) {
          isScticky = (scrollTop > angular.element(anchor).offset().top - parseInt(attrs.top));
        }
        
        element.css({ 'position': isScticky ? 'fixed' : 'relative' });

        return true;
      }

      var myCheckSticky = debounce(checkSticky, 200);

      $window.on('scroll', myCheckSticky);
      scope.$watch(attrs.reloadOnChange, myCheckSticky);
    }
  }]);
})(angular);