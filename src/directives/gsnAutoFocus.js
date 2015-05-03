(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnAutoFocus', ['$timeout', function ($timeout) {
    var directive = {
      restrict: 'EA',
      link: link
    };
    return directive;

    function link(scope, element, attrs) {

      function focusIt() {
        $timeout(function() {
          element[0].focus();
        }, 0);
      }

      scope.$watch(function () {
        if (attrs.watch) {
          var parentArr = $('.' + attrs.watch);
          if (parentArr.length > 0) {
            var parent = parentArr[parentArr.length - 1];
            return (window.getComputedStyle(parent).display === 'block');
          }
        }
        return false;
      }, function () {
        $timeout(function () {
          focusIt();
        }, 300);
      });
    }
    
  }]);
})(angular);