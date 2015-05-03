(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('groupBy', ['gsnApi', function (gsnApi) {
    // Usage: for doing grouping
    // 
    // Creates: 2013-12-26
    // 

    return function (input, attribute) {
      return gsnApi.groupBy(input, attribute);
    };
  }]);

})(angular);