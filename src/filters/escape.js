(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('escape', [function () {
    // Usage: allow for escaping html
    // 
    return function (text) {
      return escape(text);
    };
  }]);

})(angular);