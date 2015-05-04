(function (angular, undefined) {
  'use strict';
  var serviceId = 'gsnCouponPrinter';
  angular.module('gsn.core').factory(serviceId, ['$rootScope', 'gsnApi', '$log', gsnCouponPrinter]);

  function gsnCouponPrinter($rootScope, gsnApi, $log) {
    var service = {
      print: print,
      init: gcprinter.init,
      activated: false,
      isWindows: navigator.platform.indexOf('Win') > -1,
      isMac: navigator.platform.indexOf('Mac') > -1,
      dl: {
        win: "http://cdn.coupons.com/ftp.coupons.com/partners/CouponPrinter.exe",
        mac: "http://cdn.coupons.com/ftp.coupons.com/safari/MacCouponPrinterWS.dmg"
      },
      getDownload: function() {
        if (service.isWindows) {
          return dl.win;
        }
        else if (service.isMac){
          return dl.mac;
        }
        else{
          return "";
        }
      }
    };

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

      gsnprinter.on('printed', function(e, rsp) {
        $rootScope.$broadcast('gsnevent:gcprinter-printed', e, rsp);
      });

      gsnprinter.on('printing', function(e) {
        $rootScope.$broadcast('gsnevent:gcprinter-printing', e);
      });

      gsnprinter.on('printfail', function(rsp) {
        $rootScope.$broadcast('gsnevent:gcprinter-printfail', rsp);
      });
      return;
    }

    function print(coupons) {
      if (!gcprinter.isReady) {
        // keep trying to init until ready
        gcprinter.init();
        $timeout(function() {
          print(coupons)
        }, 100);
        return;
      }

      printInternal(coupons);
      return;
    };

    function printInternal(coupons) {
      var siteId = gsnApi.getChainId();

      // check printer installed, blocked, or not supported
      gsnprinter.checkInstall(function() {
        if (!gsprinter.isPrinterSupported())
        {
          // printer is not supported
          $rootScope.$broadcast('gsnevent:gcprinter-not-supported');
          return;
        }

        gcprinter.print(siteId, coupons);
      }, function() {
        // determine if printer is blocked
        if (gsnprinter.isPluginBlocked()){
          $rootScope.$broadcast('gsnevent:gcprinter-blocked');
          return;
        }

        // printer not found
        $rootScope.$broadcast('gsnevent:gcprinter-not-found');
        return;
      });
    };
  }
})(angular);
