(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.controller('ctrlPrinterBlocked', ['$scope', '$modalInstance', 'rootScope', function ($scope, $modalInstance, rootScope) {
    $scope.print = function () {
      rootScope.printClippedCoupons();
      $modalInstance.dismiss('cancel');
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }]);

  myModule.controller('ctrlPrinterInstall', ['$scope', '$modalInstance', 'rootScope', function ($scope, $modalInstance, rootScope) {
    rootScope.isSocketActive = true;

    function websocket() {
      var socket = new WebSocket("ws://localhost:26876");
      socket.onopen = function () {
        //Print coupon
        $modalInstance.dismiss('cancel');
        rootScope.printClippedCoupons();
      };

      socket.onclose = function (event) {
        if (event.wasClean) {
          console.log('Connection closed');
        } else {
          console.log('Connection lost');
        }
        console.log('Code: ' + event.code + ' reason: ' + event.reason);
      };

      socket.onmessage = function (event) {
        console.log("Recieved data: " + event.data);
      };

      socket.onerror = function (error) {
        console.log("Error: " + error.message);
        setTimeout(function () { if (rootScope.isSocketActive) websocket(); }, 1000);
      };
    }

    $scope.install = function () {
      websocket();
      rootScope.installPrint();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }]);

  myModule.controller('ctrlPrinterBlockedNoPrint', ['$scope', '$modalInstance', 'rootScope', function ($scope, $modalInstance, rootScope) {
    $scope.repeat = function () {
      rootScope.checkPrintStatus();
      $modalInstance.dismiss('cancel');
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }]);

  myModule.controller('ctrlPrinterResult', ['$scope', '$modalInstance', 'printed', 'failed', function ($scope, $modalInstance, printed, failed) {
    $scope.printed = printed;
    $scope.failed = failed;

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }]);

  myModule.controller('ctrlPrinterReady', ['$scope', '$modalInstance', 'processPrint', function ($scope, $modalInstance, processPrint) {
    $scope.readyCount = readyCount;

    $scope.print = function () {
      processPrint();
      $modalInstance.dismiss('cancel');
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }]);

  myModule.controller('ctrlRoundyFailed', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
    $scope.ok = function () {
      $modalInstance.dismiss('cancel');
    };
  }]);

  var myDirectiveName = 'ctrlCouponRoundy';

  angular.module('gsn.core')
    .controller(myDirectiveName,  ['$scope', 'gsnStore', 'gsnApi', '$timeout', '$analytics', '$filter', '$modal', 'gsnYoutech', 'gsnPrinter', 'gsnProfile', '$location', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }    

  function myController($scope, gsnStore, gsnApi, $timeout, $analytics, $filter, $modal, gsnYoutech, gsnPrinter, gsnProfile, $location) {
    $scope.checkPrinter = false;
    $scope.utInited = false;
    $scope.activate = activate;
    $scope.addCouponToCard = addCouponToCard;
    $scope.printManufacturerCoupon = printManufacturerCoupon;
    $scope.printClippedCoupons = printClippedCoupons;
    $scope.loadMore = loadMore;
    $scope.clipCoupon = clipCoupon;
    $scope.isOnClippedList = isOnClippedList;
    $scope.addClippedToList = addClippedToList;
    $scope.getClippedSavedAmount = getClippedSavedAmount;
    $scope.countClippedCoupons = countClippedCoupons;
    $scope.getPercentOfClipped = getPercentOfClipped;
    $scope.checkPrintStatus = checkPrintStatus;
    $scope.changeFilter = changeFilter;
    $scope.unclipCoupon = unclipCoupon;
    $scope.preClipCoupon = preClipCoupon;
    $scope.isSocketActive = false;
    $scope.installPrint = null;
    $scope.departments = [];
    $scope.couponsWithError = [];
    $scope.couponsPrinted = [];
    $scope.selectedCoupons = {
      items: [],
      targeted: [],
      noCircular: false,
      cardCouponOnly: false,
      printedCouponOnly: false,
      clippedCouponOnly: false,
      totalSavings: 0,
      isFailedLoading: false,
    };

    $scope.preSelectedCoupons = {
      items: [],
      targeted: []
    };

    $scope.clippedCount = 0;
    $scope.clippedCoupons = [];
    $scope.sortBy = 'EndDate';
    $scope.sortByName = 'About to Expire';
    $scope.filterByComplex = '';
    $scope.filterBy = '';
    $scope.couponType = $scope.couponType || 'digital';  // 'digital', 'printable', 'instore'
    $scope.itemsPerPage = ($location.search()).itemsperpage || ($location.search()).itemsPerPage || $scope.itemsPerPage || 20;


    function loadMore() {
      var items = $scope.preSelectedCoupons.items || [];
      if (items.length > 0) {
        var last = $scope.selectedCoupons.items.length - 1;
        for (var i = 1; i <= $scope.itemsPerPage; i++) {
          var item = items[last + i];
          if (item) {
            $scope.selectedCoupons.items.push(item);
          }
        }
      }
    }

    function loadCoupons() {
      var manuCoupons = gsnStore.getManufacturerCoupons(),
          youtechCouponsOriginal = gsnStore.getYoutechCoupons(),
          instoreCoupons = gsnStore.getInstoreCoupons();
      if ($scope.couponType == 'digital' && gsnApi.isNull(youtechCouponsOriginal.items, []).length <= 0) {
        gsnStore.refreshCircular();
        return;
      }
      else if ($scope.couponType == 'printable' && gsnApi.isNull(!manuCoupons.items, []).length <= 0) {
        gsnStore.refreshCircular();
        return;
      }
      
      preprocessCoupons(manuCoupons, youtechCouponsOriginal, instoreCoupons);
    }
    
    function preprocessCoupons(manuCoupons, youtechCouponsOriginal, instoreCoupons) {

      if (!$scope.preSelectedCoupons.items) {
        $scope.preSelectedCoupons = {
          items: [],
          targeted: []
        };
      }

      $scope.preSelectedCoupons.items.length = 0;
      $scope.preSelectedCoupons.targeted.length = 0;
      var list = $scope.preSelectedCoupons;

      if ($scope.couponType == 'digital') {
        var totalSavings = 0.0;
        if (!$scope.selectedCoupons.clippedCouponOnly) {
          angular.forEach(youtechCouponsOriginal.items, function (item) {
            if (!$scope.selectedCoupons.cardCouponOnly || !gsnYoutech.isAvailable(item.ProductCode)) {
              if (gsnYoutech.isValidCoupon(item.ProductCode)) {
                item.AddCount = 1;
                list.items.push(item);
                if (item.IsTargeted) {
                  list.targeted.push(item);
                }

                totalSavings += gsnApi.isNaN(parseFloat(item.TopTagLine), 0);
              }
            }
          });

          $scope.selectedCoupons.totalSavings = totalSavings.toFixed(2);
        } else {
          angular.forEach(youtechCouponsOriginal.items, function (item) {
            if ((!$scope.selectedCoupons.cardCouponOnly || !gsnYoutech.isAvailable(item.ProductCode)) && isOnClippedList(item)) {
              if (gsnYoutech.isValidCoupon(item.ProductCode)) {
                item.AddCount = 1;
                list.items.push(item);
                totalSavings += gsnApi.isNaN(parseFloat(item.TopTagLine), 0);
              }
            }
          });
        }
      } else if ($scope.couponType == 'printable') {
        gsnStore.getManufacturerCouponTotalSavings().then(function (rst) {
          $scope.selectedCoupons.totalSavings = parseFloat(rst.response).toFixed(2);
        });
        var printed = gsnProfile.getPrintedCoupons();
        if ($scope.selectedCoupons.printedCouponOnly) {
          angular.forEach(manuCoupons.items, function (item) {
            if (printed && printed.indexOf(item.ProductCode) >= 0)
              list.items.push(item);
          });
        } else {
          angular.forEach(manuCoupons.items, function (item) {
            if ($scope.couponsPrinted.indexOf(item.ProductCode) >= 0)
              item.isPrint = true;
          });
          if (manuCoupons.items)
            list.items = manuCoupons.items;
        }
      } else if ($scope.couponType == 'instore') {
        list.items = instoreCoupons.items;
      }
    }

    function activate() {
      loadCoupons();

      //loading departments
      $scope.departments = [];

      //Departments for digital coupons
      $scope.extDepartments = [];
      var grouppedByExtCategory = gsnApi.groupBy($scope.preSelectedCoupons.items, 'ExtCategory');
      angular.forEach(grouppedByExtCategory, function (item) {
        $scope.extDepartments.push(item.key);
      });

      //brands
      $scope.brands = [];
      var grouppedByBrands = gsnApi.groupBy($scope.preSelectedCoupons.items, 'BrandName');
      angular.forEach(grouppedByBrands, function (item) {
        $scope.brands.push({ key: item.key.replace(/'/g, "&#39;"), value: decodeURI(item.key) });
      });

      for (var key in $scope.filterByComplex) {
        var value = $scope.filterByComplex[key];
        if (typeof value == 'string' || value instanceof String)
          $scope.filterByComplex[key] = value.replace(/&#39;/g, "'");
      }

      var isTargetEnable = ($scope.filterByComplex.length !== "" || gsn.config.DisableLimitedTimeCoupons) ? null : { IsTargeted: false };
      // apply filter
      $scope.preSelectedCoupons.items = $filter('filter')($filter('filter')($scope.preSelectedCoupons.items, $scope.filterBy), isTargetEnable);
      $scope.preSelectedCoupons.items = $filter('filter')($filter('filter')($scope.preSelectedCoupons.items, $scope.filterByComplex), isTargetEnable);
      $scope.preSelectedCoupons.items = $filter('orderBy')($filter('filter')($scope.preSelectedCoupons.items, $scope.filterBy), $scope.sortBy);
      $scope.preSelectedCoupons.targeted = $filter('orderBy')($filter('filter')($scope.preSelectedCoupons.targeted, $scope.filterBy), $scope.sortBy);
      $scope.selectedCoupons.items.length = 0;

      if (!gsn.config.DisableLimitedTimeCoupons)
        $scope.selectedCoupons.targeted = $scope.preSelectedCoupons.targeted;
      if ($scope.filterByComplex.length !== "")
        $scope.selectedCoupons.targeted = [];
      loadMore();
      loadClippedCoupons();
      synchWirhErrors();
    }

    $scope.$on('gsnevent:circular-loaded', function (event, data) {
      if (data.success) {
        $timeout(function () {
          activate();
          if ($scope.checkPrinter)
            checkPrintStatus();
        }, 500);
        $scope.selectedCoupons.noCircular = false;
      } else {
        $scope.selectedCoupons.noCircular = true;
      }
    });

    $scope.$on('gsnevent:youtech-cardcoupon-loaded', activate);
    $scope.$on('gsnevent:youtech-cardcoupon-loadfail', function () {
      $scope.selectedCoupons.isFailedLoading = true;
      //Show modal
      $modal.open({
        templateUrl: gsn.getThemeUrl('/views/roundy-failed.html'),
        controller: 'ctrlRoundyFailed',
      });
    });
    $scope.$watch('sortBy', activate);
    $scope.$watch('filterBy', activate);
    $scope.$watch('selectedCoupons.cardCouponOnly', activate);
    $scope.$watch('selectedCoupons.clippedCouponOnly', activate);
    $scope.$watch('selectedCoupons.printedCouponOnly', activate);
    $scope.$watch('filterByComplex', activate);
    $timeout(activate, 500);

    //#region Internal Methods             
    function printManufacturerCoupon(evt, item) {
      gsnPrinter.initPrinter([item], true);
    }

    function synchWirhErrors() {
      if ($scope.errorsonPrint) {
        angular.forEach($scope.preSelectedCoupons.items, function (coupon) {
          var found = $filter('filter')($scope.errorsonPrint, { CouponId: coupon.ProductCode });
          if (found.length > 0) {
            unclipCoupon(coupon);
            coupon.ErrorMessage = found[0].ErrorMessage;
          }
        });
      }
    }

    function checkPrintStatus() {
      gsnPrinter.initPrinter($scope.preSelectedCoupons.items, false, {
        blocked: function () {
          $modal.open({
            templateUrl: gsn.getThemeUrl('/views/coupons-plugin-blocked-noprint.html'),
            controller: 'ctrlPrinterBlockedNoPrint',
            resolve: {
              rootScope: function () {
                return $scope;
              }
            }
          });
        },
        failedCoupons: function (errors) {
          $scope.errorsonPrint = errors;
          synchWirhErrors();
        },
      }, true);
    }

    function printClippedCoupons() {
      var clippedCouponsInArr = Object.keys($scope.clippedCoupons).map(function (key) {
        return $scope.clippedCoupons[key];
      });
      gsnPrinter.initPrinter(clippedCouponsInArr, false, {
        notInstalled: function (installFc) {
          $scope.installPrint = installFc;
          //Show popup
          var modalInstance = $modal.open({
            templateUrl: gsn.getThemeUrl('/views/coupons-plugin-install.html'),
            controller: 'ctrlPrinterInstall',
            resolve: {
              rootScope: function () {
                return $scope;
              }
            }
          });

          modalInstance.result.then(function () {
            $scope.isSocketActive = false;
          }, function () {
            $scope.isSocketActive = false;
          })['finally'](function () {
            $scope.modalInstance = undefined;
          });
        },
        blocked: function () {
          $modal.open({
            templateUrl: gsn.getThemeUrl('/views/coupons-plugin-blocked.html'),
            controller: 'ctrlPrinterBlocked',
            resolve: {
              rootScope: function () {
                return $scope;
              }
            }
          });
        },
        result: function (printed, failed) {
          angular.forEach($scope.preSelectedCoupons.items, function (coupon) {
            if (isOnClippedList(coupon)) {
              unclipCoupon(coupon);
              coupon.isPrint = true;
              $scope.couponsPrinted = [];
              $scope.couponsPrinted.push(coupon);
            }
          });
          $modal.open({
            templateUrl: gsn.getThemeUrl('/views/coupons-plugin-result.html'),
            controller: 'ctrlPrinterResult',
            resolve: {
              printed: function () {
                return printed;
              },
              failed: function () {
                return failed;
              }
            }
          });
        },
        readyAlert: function (readyCount, processPrint) {
          processPrint();
        },
        failedCoupons: function (errors) {
          $scope.errorsonPrint = errors;
          synchWirhErrors();
        },
      }, false);
    }

    function addCouponToCard(evt, item) {
      if ($scope.youtech.isAvailable(item.ProductCode)) {
        $scope.youtech.addCouponTocard(item.ProductCode).then(function (rst) {
          if (rst.success) {
            // log coupon add to card
            //var cat = gsnStore.getCategories()[item.CategoryId];
            $analytics.eventTrack('CouponAddToCard', { category: item.ExtCategory, label: item.Description1, value: item.ProductCode });

            $scope.clippedCoupons[item.ProductCode] = item;
            // apply
            $timeout(function () {
              item.AddCount++;
            }, 50);
          }
        });
      } else {
        // log coupon remove from card
        //var cat = gsnStore.getCategories()[item.CategoryId];
        $analytics.eventTrack('CouponRemoveFromCard', { category: item.ExtCategory, label: item.Description1, value: item.ProductCode });

        // apply
        $timeout(function () {
          item.AddCount--;
        }, 50);
      }
    }

    function clipCoupon(item) {
      item.isPrint = false;
      item.ErrorMessage = null;
      if (!$scope.clippedCoupons[item.ProductCode]) {
        $scope.clippedCoupons[item.ProductCode] = item;
        gsnProfile.clipCoupon(item.ProductCode);
      }
      countClippedCoupons();
    }

    function preClipCoupon(item) {
      gsnProfile.savePreclippedCoupon(item);
    }

    function unclipCoupon(item) {
      if ($scope.clippedCoupons[item.ProductCode]) {
        $scope.clippedCoupons[item.ProductCode] = null;
        gsnProfile.unclipCoupon(item.ProductCode);
      }
      countClippedCoupons();
    }

    function isOnClippedList(item) {
      return gsnApi.isNull($scope.clippedCoupons[item.ProductCode], null) !== null;
    }

    function countClippedCoupons() {
      $scope.clippedCount = Object.keys($scope.clippedCoupons).length;
      return $scope.clippedCount;
    }

    function addClippedToList() {
      angular.forEach($scope.clippedCoupons, function (coupon) {
        if (!gsnProfile.isOnList(coupon))
          $scope.doToggleCartItem(null, coupon);
      });
    }

    function getClippedSavedAmount() {
      var saved = 0;
      for (var key in $scope.clippedCoupons) {
        if (!isNaN(parseInt(key))) {
          var coupon = $scope.clippedCoupons[key];
          saved += parseFloat(coupon.SavingsAmount);
        }
      }
      return saved.toFixed(2);
    }

    function getPercentOfClipped() {
      var result = getClippedSavedAmount() / $scope.selectedCoupons.totalSavings * 100;
      if (!result)
        result = 0;
      return { width: result + '%' };
    }

    function loadClippedCoupons() {
      if ($scope.couponType == 'digital') {

        angular.forEach($scope.preSelectedCoupons.items, function (coupon) {
          if (!isOnClippedList(coupon) && gsnYoutech.isOnCard(coupon.ProductCode)) {
            $scope.clippedCoupons[coupon.ProductCode] = coupon;
          }
        });
        angular.forEach($scope.preSelectedCoupons.targeted, function (coupon) {
          if (!isOnClippedList(coupon) && gsnYoutech.isOnCard(coupon.ProductCode)) {
            $scope.clippedCoupons[coupon.ProductCode] = coupon;
          }
        });

        var preclipped = gsnProfile.getPreclippedCoupon();
        if (preclipped)
          if (!isOnClippedList(preclipped) && gsnYoutech.hasValidCard())
            addCouponToCard(null, preclipped);
      } else {
        var clippedIds = gsnProfile.getClippedCoupons();

        angular.forEach($scope.preSelectedCoupons.items, function (coupon) {
          angular.forEach(clippedIds, function (id) {
            if (id == coupon.ProductCode && !isOnClippedList(coupon)) {
              $scope.clippedCoupons[coupon.ProductCode] = coupon;
            }
          });
        });
      }
      countClippedCoupons();
    }

    function changeFilter(newfilter, sortByName) {
      $scope.filterByComplex = newfilter;
      $scope.sortByName = sortByName;
    }

    //#endregion
  }
})(angular);
