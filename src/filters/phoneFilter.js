(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('tel', function () {
    // Usage: phone number formating phoneNumber | tel
    // 
    // Creates: 2014-9-1
    // 

    return function (tel) {
      if (!tel) return '';

      var value = tel.toString();    
      return  value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6);        
    };
  });

})(angular);