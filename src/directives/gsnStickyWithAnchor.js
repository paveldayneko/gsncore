(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive("gsnStickyWithAnchor", ['$window', '$timeout', function ($window, $timeout) {

    var directive = {
      link: link,
      restrict: 'A',
    };
    return directive;

    function link(scope, element, attrs) {
      var anchor = angular.element('<div class="sticky-anchor"></div>');
      angular.element(element[0]).before(anchor);
      if (attrs.bottom) {
        element.css({ 'bottom': parseInt(attrs.bottom) });
      }
      if (attrs.top) {
        element.css({ 'top': parseInt(attrs.top) });
      }

      function checkSticky() {
        var scrollTop = angular.element($window).scrollTop();
        var screenHight = angular.element($window).height();
        var isScticky = false;
        if (attrs.bottom) {
          isScticky = (scrollTop + screenHight < angular.element(anchor).offset().top + parseInt(attrs.bottom));
        }
        
        if (attrs.top) {
          isScticky = (scrollTop > angular.element(anchor).offset().top - parseInt(attrs.top));
        }
        
        element.css({ 'position': isScticky ? 'fixed' : 'relative' });
      }

      angular.element($window).on('scroll', checkSticky);
      
      scope.$watch(attrs.reloadOnChange, function () {
        $timeout(checkSticky, 300);
      });
    }
  }]);
})(angular);