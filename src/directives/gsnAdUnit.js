(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnAdUnit', ['gsnStore', '$timeout', 'gsnApi', '$rootScope', '$http', '$templateCache', '$interpolate', function (gsnStore, $timeout, gsnApi, $rootScope, $http, $templateCache, $interpolate) {
    // Usage: create an adunit and trigger ad refresh
    // 
    // Creates: 2014-04-05 TomN
    // 
    var directive = {
      restrict: 'A',
      link: link
    };
    return directive;

    function link(scope, elm, attrs) {
      scope.templateHtml = null;
      var tileId = gsnApi.isNull(attrs.gsnAdUnit, '');
      if (tileId.length > 0) {
        var templateUrl = gsnApi.getThemeUrl('/../common/views/tile' + tileId + '.html');
        var templateLoader = $http.get(templateUrl, { cache: $templateCache });
        var hasTile = false;


        templateLoader.success(function(html) {
          scope.templateHtml = html;
        }).then(linkTile);
      }

      function linkTile() {
        if (tileId.length > 0) {
          if (hasTile && scope.templateHtml) {
            elm.html(scope.templateHtml);
            var html = $interpolate(scope.templateHtml)(scope);
            elm.html(html);

            // broadcast message
            $rootScope.$broadcast('gsnevent:loadads');
          }
        } else {
          if (hasTile) {
            // find adunit
            elm.find('.gsnadunit').addClass('gsnunit');
            
            // broadcast message
            $rootScope.$broadcast('gsnevent:loadads');
          }
        }
      }      

      gsnStore.getAdPods().then(function(rsp) {
        if (rsp.success) {
          // check if tile is in response
          // rsp.response;
          if (attrs.tile) {
            for (var i = 0; i < rsp.response.length; i++) {
              var tile = rsp.response[i];
              if (tile.Code == attrs.tile) {
                hasTile = true;
                break;
              }
            }
          } else {
            hasTile = true;
          }

          linkTile();
        }
      });
    }
  }]);
})(angular);