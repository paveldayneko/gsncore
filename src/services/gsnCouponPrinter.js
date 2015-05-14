(function (angular, undefined) {
  'use strict';
  var serviceId = 'gsnCouponPrinter';
  angular.module('gsn.core').service(serviceId, ['$rootScope', 'gsnApi', '$log', '$timeout', 'gsnStore', 'gsnProfile', gsnCouponPrinter]);

  function gsnCouponPrinter($rootScope, gsnApi, $log, $timeout, gsnStore, gsnProfile) {
    var service = {
      print: print,
      init: gcprinter.init,
      activated: false
    };
    var couponClasses = [];
    var coupons = [];

    activate();

    return service;

    function activate() {
      // wait until gcprinter is available
      if (typeof(gcprinter) == 'undefined') {
        $log.log('waiting for gcprinter...');
        $timeout(activate, 100);
        return;
      }

      if (service.activated) return;
      service.activated = true

      gcprinter.on('printed', function(e, rsp) {
        $timeout(function () {
          // process coupon error message
          var errors = gsnApi.isNull(rsp.ErrorCoupons, []);
          if (errors.length > 0) {
            angular.forEach(errors, function (item) {
              angular.element('.coupon-message-' + item.CouponId).html(item.ErrorMessage);
            });
          }
          $rootScope.$broadcast('gsnevent:gcprinter-printed', e, rsp);
        }, 5);
      });

      gcprinter.on('printing', function(e) {
        $timeout(function () {
          angular.element(couponClasses.join(',')).html('Printing...');
          $rootScope.$broadcast('gsnevent:gcprinter-printing', e);
        }, 5);
      });

      gcprinter.on('printfail', function(e, rsp) {
        $timeout(function () {
          if (e == 'gsn-server') {
            angular.element(couponClasses.join(',')).html('Print limit reached...');
          }
          else if (e == 'gsn-cancel') {
            angular.element(couponClasses.join(',')).html('Print canceled...');
          } else {
            angular.element(couponClasses.join(',')).html('Print failed...');
          }
          $rootScope.$broadcast('gsnevent:gcprinter-printfail', rsp);
        }, 5);
      });
      return;
    }

    function print(items) {
      if ((items || []).length <= 0){
        return;
      }

      coupons.length = 0;
      couponClasses.length = 0;
      angular.forEach(items, function (v, k) {
        var item = v;
        if (gsnApi.isNull(v.ProductCode, null) == null)
        {
          item = gsnStore.getCoupon(v.ItemId, v.ItemTypeId);
        }
        
        couponClasses.push('.coupon-message-' + v.ProductCode);
        coupons.push(v.ProductCode);
      });

      $timeout(function () {
        angular.element(couponClasses.join(',')).html('Checking, please wait...');
      }, 5);

      if (!gcprinter.isReady) {
        // keep trying to init until ready
        gcprinter.on('initcomplete', function() {
          $timeout(printInternal, 5);
        });
        gcprinter.init();
        return;
      }
      else {
        $timeout(printInternal, 5);
      }
    };

    function printInternal() {
      var siteId = gsnApi.getChainId();
      if (!gcprinter.hasPlugin()) {
        $rootScope.$broadcast('gsnevent:gcprinter-not-found');
      }
      else if (gcprinter.isPluginBlocked()) {
        $rootScope.$broadcast('gsnevent:gcprinter-blocked');
      }
      else if (!gcprinter.isPrinterSupported()) {
        $rootScope.$broadcast('gsnevent:gcprinter-not-supported');
      }
      else {
        angular.forEach(coupons, function (v) {
          gsnProfile.addPrinted(v);
        });
        gcprinter.print(siteId, coupons);
      }
    };
  }
})(angular);
