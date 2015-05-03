(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlCircular';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', '$timeout', 'gsnStore', '$rootScope', '$location', 'gsnProfile', 'gsnApi', '$analytics', '$filter', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, $timeout, gsnStore, $rootScope, $location, gsnProfile, gsnApi, $analytics, $filter) {
    $scope.activate = activate;

    $scope.pageId = 99; // it's always all items for desktop     
    $scope.loadAll = $scope.loadAll || false;
    $scope.itemsPerPage = $scope.itemsPerPage || 10;
    $scope.sortBy = $scope.sortBy || 'CategoryName';
    $scope.sortByName = $scope.sortByName || 'department';
    $scope.actualSortBy = $scope.sortBy;

    $scope.allItems = [];
    $scope.loadMore = loadMore;
    $scope.vm = { cacheItems: [], digitalCirc: null };

    function activate() {
      
      var config = gsnApi.getConfig();
      if ($scope.currentPath == '/circular' && (gsnApi.isNull(config.defaultMobileListView, null) === null)) {
        config.defaultMobileListView = true;
        if (gsnApi.browser.isMobile && gsnApi.getThemeConfig('default-mobile-listview')) {
          gsnApi.goUrl('/circular/list');
          return;
        }
      }

      // broadcast message
      $rootScope.$broadcast('gsnevent:loadads');
      
      if (gsnStore.hasCompleteCircular()) {
        var data = gsnStore.getCircularData();

        if (data.Circulars.length <= 0) {
          return;
        }

        $scope.doSearchInternal();
        $scope.vm.digitalCirc = data;
      }
    }

    $scope.doAddCircularItem = function (evt, tempItem) {
      var item = gsnStore.getItem(tempItem.ItemId);
      if (item) {
        gsnProfile.addItem(item);

        if (gsnApi.isNull(item.Varieties, null) === null) {
          item.Varieties = [];
        }

        $scope.vm.selectedItem = item;
      }
    };

    $scope.doToggleCircularItem = function (evt, tempItem) {
      if ($scope.isOnList(tempItem)) {
        gsnProfile.removeItem(tempItem);
      } else {
        $scope.doAddCircularItem(evt, tempItem);
      }
    };

    $scope.toggleSort = function (sortBy) {
      $scope.sortBy = sortBy;
      var reverse = (sortBy == $scope.actualSortBy);
      $scope.actualSortBy = ((reverse) ? '-' : '') + sortBy;
      $scope.doSearchInternal();
    };

    $scope.$on('gsnevent:shoppinglist-loaded', activate);
    $scope.$on('gsnevent:digitalcircular-itemselect', $scope.doAddCircularItem);

    $scope.$watch('vm.selectedItem', function (newValue, oldValue) {
      if (newValue) {
        if (gsnApi.isNull(newValue.Varieties, []).length > 0) return;
        if (newValue.LinkedItemCount <= 0) return;

        gsnStore.getAvailableVarieties(newValue.ItemId).then(function (result) {
          if (result.success) {
            // this is affecting the UI so render it on the UI thread
            $timeout(function () {
              newValue.Varieties = result.response;
            }, 0);
          }
        });
      }
    });

    $scope.doSearchInternal = function () {
      var circularPage = gsnStore.getCircular($scope.pageId);
      var list = gsnProfile.getShoppingList();

      // don't show circular until data and list are both loaded
      if (gsnApi.isNull(circularPage, null) === null || gsnApi.isNull(list, null) === null) return;

      var result = $filter('orderBy')($filter('filter')(circularPage.items, $scope.vm.filterBy || ''), $scope.actualSortBy);
      $scope.vm.cacheItems = result;
      $scope.allItems = [];
      loadMore();
    };

    $scope.$watch('vm.filterBy', $scope.doSearchInternal);

    $scope.$on('gsnevent:circular-loaded', function (event, data) {
      if (data.success) {
        $scope.vm.noCircular = false;
        $timeout(activate, 500);
      } else {
        $scope.vm.noCircular = true;
      }
    });
    
    $timeout(activate, 50);
    //#region Internal Methods        

    function loadMore() {
      var items = $scope.vm.cacheItems || [];
      if (items.length > 0) {
        var itemsToLoad = $scope.itemsPerPage;
        if ($scope.loadAll) {
          itemsToLoad = items.length;
        }

        var last = $scope.allItems.length - 1;
        for (var i = 1; i <= itemsToLoad; i++) {
          var item = items[last + i];
          if (item) {
            $scope.allItems.push(item);
          }
        }
      }
    }

    //#endregion
  }
})(angular);
