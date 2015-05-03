(function (angular, undefined) {
  'use strict';
  var serviceId = 'gsnPrinter';
  angular.module('gsn.core').factory(serviceId, ['$rootScope', '$timeout', '$http', 'gsnApi', '$notification', '$window', '$log', '$analytics', 'gsnProfile', gsnPrinter]);

  function gsnPrinter($rootScope, $timeout, $http, gsnApi, $notification, $window, $log, $analytics, gsnProfile) {
    // Usage: Printing and CouponsInc integration service 
    //    allow for wrapping dangerous and stupid couponsinc global method outside of framework
    //    to improve framework unit testing
    //
    // Summary: 
    //
    // Creates: 2013-12-28 TomN
    // 

    var service = {
      initPrinter: initPrinter,
      printerCode: 0,
      hasInit: false,
      printed: false,
      printNow: false,
      coupons: [],
      callBack: null,
      checkStatus: false,
      printerFrame: '<div class="hidden"><iframe id="ci_ic1" name="ci_ic1" height="0" width="0" style="position: absolute; top: -9999em; left: -9999em; width: 0px; height: 0px; border: 0; z-index: 99;"></iframe></div>'
    };
    
    // inject printer iframe
    if (angular.element('#ci_ic1').length <= 0) {
      angular.element('body').append(service.printerFrame);
    }
    
    // overriding existing function
    $window.showResultOfDetectControl = function (code) {
      if (service.printed) return;
      var codeNum = gsnApi.isNaN(parseFloat(code), 0);

      if (codeNum > 0) {
        service.printerCode = codeNum;
        doPrint();
      } else {
        service.hasInit = false;
        if (service.printed) return;

        var sBlockedMessage = 'It\'s possible that the CI coupon printer installed plugin has been disabled.  Please make sure to enable CI coupon printer browser plugin.';
        if (code == 'BLOCKED') {
          if (service.callBack && service.callBack.blocked)
            service.callBack.blocked();
          else
            $notification.alert(sBlockedMessage);
          return;
        } else if (code == 'ERROR') {

          sBlockedMessage = 'The CI coupon printer has thrown an error that cannot be recovered.  You may need to uninstall and reinstall the CI coupon printer to fix this issue.';
          $notification.alert(sBlockedMessage);
        }
        else {
          // cause download to printer   
          
          if (typeof (ci_downloadFFSilent) === 'function') {
            if (service.printed) return;

            if (service.callBack && service.callBack.notInstalled)
              service.callBack.notInstalled(ci_downloadFFSilent);
            else
              $timeout(ci_downloadFFSilent, 5);
          }
        }

        // show coupon printer download instruction event
        $rootScope.$broadcast('gsnevent:printerdownload-instruction', service);
      }
    };
    
    return service;

    function createCouponsIntHtml() {
      var idDiv = angular.element('#ci_div1');
      if (idDiv.length <= 0) {
        var els = angular.element('<div id="ci_div1"></div><div id="ci_div2"></div><iframe src="about:blank" id="pmgr" width="1" height="1" style="visibility: hidden"></iframe>');
        var body = angular.element('body');
        angular.forEach(els, function (el) {
          body[0].appendChild(el);
        });
      }
    }
    
    function doPrint() {
      // make sure printing is on the UI thread
      $timeout(doPrintInternal, 50);
    }
    
    function doPrintInternal() {

      // do not proceed if there is no coupon to print
      if (service.coupons <= 0) return;

      // setup error message
      var sErrorMessage = 'Your coupon(s) were unavailable for printing. You may have already printed this coupon the maximum number of times.';
      gsnApi.getAccessToken().then(function () {
        var url = gsnApi.getShoppingListApiUrl() + '/CouponPrintScript/' + gsnApi.getChainId() + '?nocache=' + (new Date()).getTime();
        var couponIds = [];
        var couponidz = '';
        var couponClasses = [];
        angular.forEach(service.coupons, function (v, k) {
          couponIds.push(v.ProductCode);
          couponidz += ',' + v.ProductCode;
          couponClasses.push('.coupon-message-' + v.ProductCode);
        });

        var couponElements = angular.element(couponClasses.join(','));
        if (service.printed) return;
        service.printed = true;

        $http.post(url, { Coupons: couponIds, DeviceId: service.printerCode }, { headers: gsnApi.getApiHeaders() })
            .success(function (response) {
              if (response.Success) {

                if (couponElements.length <= 0) return;
                
                $timeout(function () {
                  if (!service.checkStatus)
                    couponElements.html('Printing...');
                  
                  var printErrorIds = '';
                  // process coupon error message
                  var errors = gsnApi.isNull(response.ErrorCoupons, []);
                  if (errors.length > 0) {
                    angular.forEach(errors, function (item) {
                      angular.element('.coupon-message-' + item.CouponId).html(item.ErrorMessage);
                      printErrorIds += ',' + item.CouponId;
                    });

                    $rootScope.$broadcast('gsnevent:couponprinting-error', errors);
                  }

                  if (service.callBack && service.callBack.failedCoupons)
                    service.callBack.failedCoupons(errors);

                  if (service.checkStatus)
                    return;
                  
                  if (service.callBack && service.callBack.readyAlert) {
                    service.callBack.readyAlert(service.coupons.length - errors.length, function () { startPrint(errors, couponElements, response); });
                  } else {
                    // somehow, we need this alert.  I think coupons inc need time to sync.
                    sErrorMessage = 'Click "OK" to print your manufacturer coupon(s).';
                    if (service.printNow) {
                      sErrorMessage += '  Use the "Print" button to print your List.';
                    }
                    if (service)
                      $notification.confirm(sErrorMessage, function(result) {
                        if (result == 1) {
                          startPrint(errors, couponElements, response);
                        }
                      });
                  }
                }, 50);
              } else {
                $timeout(function() {
                  $notification.alert(sErrorMessage);
                }, 50);
              }
            }).error(function (response) {
              $timeout(function() {
                couponElements.html('Print Limit Reached');
                $notification.alert(sErrorMessage);
              }, 50);
            });
      });
    }
    
    function startPrint(errors, couponElements, response) {
      angular.forEach(service.coupons, function (v) {
        gsnProfile.addPrinted(v.ProductCode);
      });
      if (service.callBack && service.callBack.result) {
        var failed = errors.length;
        var printed = service.coupons.length - errors.length;
        service.callBack.result(printed, failed);
      }
      printCoupons(response.DeviceId, response.Token);
    }

    function initPrinter(coupons, printNow, callBack, checkStatus) {
      createCouponsIntHtml();
      service.coupons = gsnApi.isNull(coupons, []);
      service.checkStatus = checkStatus;
      service.printNow = printNow;
      service.callBack = callBack;
      var couponClasses = [];
      angular.forEach(service.coupons, function (v, k) {
        couponClasses.push('.coupon-message-' + v.ProductCode);
      });
      if (!service.callBack)
        $timeout(function () {
          angular.element(couponClasses.join(',')).html('Checking...');
        }, 5);
      
      // if the printer already been initialized, then just print
      if (gsnApi.isNaN(parseInt(service.printerCode), 0) > 0) {
        service.printed = false;
        // this should be on the UI thread
        doPrint();
      } else {

        if (service.hasInit) return;
        service.hasInit = true;
        
        var scriptUrl = gsnApi.getApiUrl() + '/ShoppingList/CouponInitScriptFromBrowser/' + gsnApi.getChainId() + '?callbackFunc=showResultOfDetectControl&nocache=' + gsnApi.getVersion();
        gsnApi.loadScripts([scriptUrl], function () {
           // no need to do anything, the server-side script can execute on its own.
        });
      }
    }

    //#region Internal Methods        
    function printCoupons(pid, strToken) {
      /// <summary>
      ///     Actual method fo printing coupon.
      ///     - the token determine which coupon we sent to couponsinc
      ///     - it load an iframe that will trigger the printer plugin
      /// </summary>
      /// <param name="Pid" type="Object"></param>
      /// <param name="strToken" type="Object"></param>

      if (gsnApi.isNull(strToken, '').length > 0) {
        var strUrl = 'http://insight.coupons.com/cos20/printmanager.aspx';
        strUrl += '?PID=' + pid;
        strUrl += '&PrintCartToken=' + encodeURIComponent(strToken);
        strUrl += '&PostBackURL=' + encodeURIComponent('http://insight.coupons.com/cos20/ThankYou.aspx');
        
        var pframe = angular.element("#pmgr");
        if (pframe.length > 0) {
          pframe.attr("src", strUrl);
        }
        else {
          $log.warn('Frame does not exist');
        }
      }
    }
    //#endregion
  }
})(angular);
