(function (angular, undefined) {
  'use strict';
  var serviceId = 'gsnCouponPrinter';
  angular.module('gsn.core').service(serviceId, ['$rootScope', 'gsnApi', '$log', '$timeout', gsnCouponPrinter]);

  function gsnCouponPrinter($rootScope, gsnApi, $log, $timeout) {
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
        // process coupon error message
        var errors = gsnApi.isNull(rsp.ErrorCoupons, []);
        if (errors.length > 0) {
          angular.forEach(errors, function (item) {
            angular.element('.coupon-message-' + item.CouponId).html(item.ErrorMessage);
          });
        }

        $rootScope.$broadcast('gsnevent:gcprinter-printed', e, rsp);
      });

      gcprinter.on('printing', function(e) {
        $timeout(function () {
          angular.element(couponClasses.join(',')).html('Printing...');
        }, 5);
        $rootScope.$broadcast('gsnevent:gcprinter-printing', e);
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
        }, 5);
        $rootScope.$broadcast('gsnevent:gcprinter-printfail', rsp);
      });
      return;
    }

    function print(items) {
      if (!gcprinter.isReady) {
        // keep trying to init until ready
        gcprinter.init();
        $timeout(function() {
          print(items)
        }, 100);
        return;
      }

      if ((items || []).length <= 0){
        return;
      }

      printInternal(items);
      return;
    };

    function printInternal(items) {
      var siteId = gsnApi.getChainId();
      coupons.length = 0;
      couponClasses.length = 0;
      angular.forEach(items, function (v, k) {
        couponClasses.push('.coupon-message-' + v.ProductCode);
        coupons.push(v.ProductCode);
      });

      $timeout(function () {
        angular.element(couponClasses.join(',')).html('Checking...');
      }, 5);

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
        gcprinter.print(siteId, coupons);
      }
    };
  }
})(angular);
