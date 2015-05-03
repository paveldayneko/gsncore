(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnRedirectOnResize', ['$window', '$location', function ($window, $location) {
    var directive = {
      restrict: 'EA',
      scope: true,
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      $(window).resize(function () {
        if (angular.element($window).width() < attrs.min) {
          $location.url(attrs.url);
        }
      });
    }
  }]);
})(angular);