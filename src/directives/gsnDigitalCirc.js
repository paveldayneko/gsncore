(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnDigitalCirc', ['$timeout', '$rootScope', '$analytics', 'gsnApi', '$location', 
    function ($timeout, $rootScope, $analytics, gsnApi, $location) {
    // Usage: create classic hovering digital circular
    // 
    // Creates: 2013-12-12 TomN
    // 
    var directive = {
      restrict: 'EA',
      scope: false,
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      scope.$watch(attrs.gsnDigitalCirc, function (newValue) {
        if (newValue) {
          if (newValue.Circulars.length > 0) {
            var el = element.find('div');
            var plugin = el.digitalCirc({
              data: newValue,
              browser: gsnApi.browser,
              onItemSelect: function (plug, evt, item) {
                // must use timeout to sync with UI thread
                $timeout(function () {
                  $rootScope.$broadcast('gsnevent:digitalcircular-itemselect', item);
                }, 50);
              },
              onCircularInit: function(plug){
                // switch circular with query string
                var q = $location.search();
                if (q.c) {
                  $rootScope.previousQuery = angular.copy(q);
                  $location.search('p', null);
                  $location.search('c', null);
                  $location.replace();
                  return true;
                }
                return false;
              },
              onCircularDisplaying: function (plug, circIdx, pageIdx) {
                // switch circular with query string
                if ($rootScope.previousQuery)
                {
                  var q = $rootScope.previousQuery;
                  $rootScope.previousQuery = null;
                  plug.displayCircular(parseInt(q.c), parseInt(q.p));
                  return true;
                }

                // must use timeout to sync with UI thread
                $timeout(function () {
                  // trigger ad refresh for circular page changed
                  $rootScope.$broadcast('gsnevent:digitalcircular-pagechanging', { plugin: plug, circularIndex: circIdx, pageIndex: pageIdx });
                }, 50);

                var circ = plug.getCircular(circIdx);
                if (circ) {
                  $analytics.eventTrack('PageChange', { category: 'Circular_Type' + circ.CircularTypeId + '_P' + (pageIdx + 1), label: circ.CircularDescription, value: pageIdx });
                }

                return false;
              }
            });
          }
        }
      });
    }
  }]);
})(angular);