(function (angular, undefined) {
  'use strict';
  var serviceId = 'gsnCouponPrinter';
  angular.module('gsn.core').service(serviceId, ['$rootScope', 'gsnApi', '$log', '$timeout', 'gsnStore', 'gsnProfile', '$window', gsnCouponPrinter]);

  function gsnCouponPrinter($rootScope, gsnApi, $log, $timeout, gsnStore, gsnProfile, $window) {
    var service = {
      print: print,
      init: init,
      loadingScript: false,
      isScriptReady: false,
      activated: false,
      retries: 0
    };
    var couponClasses = [];
    var coupons = [];

    activate();

    return service;

    function activate() {
      if (typeof(gcprinter) == 'undefined') {
        $log.log('waiting for gcprinter...');
        $timeout(activate, 500);

        if (service.loadingScript) return;

        service.loadingScript = true;

        // dynamically load google
        var src = '//cdn.gsngrocers.com/script/gcprinter/gcprinter.min.js';

        gsnApi.loadScripts([src], activate);
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

     // keep trying to init until ready
      gcprinter.on('initcomplete', function() {
        service.isScriptReady = true;
        init();
        $rootScope.$broadcast('gsnevent:gcprinter-initcomplete');
      });
      return;
    }

    function init() {
      if (typeof(gcprinter) === 'undefined') {
        $timeout(init, 500);
        return;
      }

      if (!service.isScriptReady) {
        gcprinter.init();
        return;
      }

      if (!gcprinter.hasPlugin()){
        detectPluginWithWebSocket(function() {
          $timeout(printInternal, 5);
        });
      }
      else {
        $timeout(printInternal, 5);
      }
    }

    function print(items) {
      if ((items || []).length <= 0){
        return;
      }

      coupons.length = 0;
      couponClasses.length = 0;
      angular.forEach(items, function (v, k) {
        var item = v;
        if (item) {
          if (gsnApi.isNull(v.ProductCode, null) == null)
          {
            item = gsnStore.getCoupon(v.ItemId, v.ItemTypeId);
          }
          
          couponClasses.push('.coupon-message-' + item.ProductCode);
          coupons.push(item.ProductCode);
        }
      });

      $timeout(function () {
        angular.element(couponClasses.join(',')).html('Checking, please wait...');
      }, 5);

      if (!gcprinter.isReady) {
        // keep trying to init until ready
        gcprinter.on('initcomplete', function() {
          if (!gcprinter.hasPlugin()){
            detectPluginWithWebSocket(function() {
              $timeout(printInternal, 5);
              $rootScope.$broadcast('gsnevent:gcprinter-initcomplete');
            });
          }
          else {
            $timeout(printInternal, 5);
            $rootScope.$broadcast('gsnevent:gcprinter-initcomplete');
          }
        });
        gcprinter.init();
        return;
      }

      $timeout(printInternal, 5);
    };

    function printInternal() {
      if (!gcprinter.hasPlugin()) {
        $rootScope.$broadcast('gsnevent:gcprinter-not-found');
      }
      else if (gcprinter.isPluginBlocked()) {
        $rootScope.$broadcast('gsnevent:gcprinter-blocked');
      }
      else if (!gcprinter.isPrinterSupported()) {
        $rootScope.$broadcast('gsnevent:gcprinter-not-supported');
      }
      else if (coupons.length > 0){
        var siteId = gsnApi.getChainId();
        angular.forEach(coupons, function (v) {
          gsnProfile.addPrinted(v);
        });
        gcprinter.print(siteId, coupons);
      }
    };
		
	function detectPluginWithWebSocket(cb) {
	  var socket = new WebSocket("ws://localhost:26876");
      socket.onopen = cb;
      socket.onerror = function (error) {
        service.retries++;
        if (service.retries > 4) return;

		    setTimeout(detectPluginWithWebSocket, 1000);
      };
	  };
  }
})(angular);
