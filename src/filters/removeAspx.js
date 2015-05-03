(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('removeAspx', ['gsnApi', function (gsnApi) {
    // Usage: for removing aspx
    // 
    // Creates: 2014-01-05
    // 

    return function (text) {
      return gsnApi.isNull(text, '').replace(/(.aspx\"|.gsn\")+/gi, '"');
    };
  }]);

})(angular);