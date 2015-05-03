(function (angular, undefined) {
  'use strict';

  // TODO: Refactor this thing when there are time, too much globally WTF in here - the result of rushing to release
  var myDirectiveName = 'ctrlBody';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnGlobal', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnGlobal) {
    gsnGlobal.init(false, $scope);
  }
})(angular);
