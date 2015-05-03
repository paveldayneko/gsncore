(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnProfilePixel', ['$sce', 'gsnApi', '$interpolate', '$timeout', function ($sce, gsnApi, $interpolate, $timeout) {
    // Usage: add 3rd party pixel tracking on a profile basis
    // 
    // Creates: 2013-12-12 TomN
    // 
    var directive = {
      restrict: 'EA',
      scope: true,
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      scope.$watch(gsnApi.getProfileId, function (newValue) {
        $timeout(function() {
          element.html('');
          scope.CACHEBUSTER = new Date().getTime();
          scope.ProfileId = newValue;
          scope.StoreId = gsnApi.getSelectedStoreId();
          scope.ChainId = gsnApi.getChainId();
          var url = $sce.trustAsResourceUrl($interpolate(attrs.gsnProfilePixel.replace(/\[+/gi, '{{').replace(/\]+/gi, '}}'))(scope));

          element.html('<img src="' + url + '" style="visibility: hidden !important; width: 0px; height: 0px; display: none !important; opacity: 0 !important;" class="trackingPixel hidden"  alt="tracking pixel"/>');
        }, 50);
      });
    }
  }]);
})(angular);