(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnPathPixel', ['$sce', 'gsnApi', '$interpolate', '$timeout', function ($sce, gsnApi, $interpolate, $timeout) {
    // Usage: add pixel tracking on a page/path basis
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
      var currentPath = '';
      scope.$on('$routeChangeSuccess', function (evt, next, current) {
        var matchPath = angular.lowercase(gsnApi.isNull(attrs.path, ''));

        if (matchPath.length <= 0 || gsnApi.isNull(scope.currentPath, '').indexOf(matchPath) >= 0) {
          if (currentPath == scope.currentPath) {
            return;
          }
          
          $timeout(function() {
            element.html('');
            currentPath = scope.currentPath;
            scope.ProfileId = gsnApi.getProfileId();
            scope.CACHEBUSTER = new Date().getTime();

            // profileid is required
            if (scope.ProfileId <= 0) {
              if (attrs.gsnPathPixel.indexOf('ProfileId') > 0) return;
            }

            scope.StoreId = gsnApi.getSelectedStoreId();
            scope.ChainId = gsnApi.getChainId();
            var url = $sce.trustAsResourceUrl($interpolate(attrs.gsnPathPixel.replace(/\[+/gi, '{{').replace(/\]+/gi, '}}'))(scope));
            element.html('<img src="' + url + '" style="visibility: hidden !important; width: 0px; height: 0px; display: none !important; opacity: 0 !important;" class="trackingPixel hidden" alt="tracking pixel"/>');
          }, 50);
        }
      });
    }
  }]);

})(angular);