// collection of misc service and factory
(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  // $notication
  myModule.service('$notification', ['$rootScope', '$window', function ($rootScope, $window) {
    var service = {
      alert: function (message) {
        if (!$window.isPhoneGap) {
          $window.alert(message);
          return;
        }

        navigator.notification.alert(message, null, '', 'OK');
      },
      confirm: function (message, callbackFn, title, buttonLabels) {
        if (gsn.isNull(buttonLabels, null) === null) {
          buttonLabels = 'OK,Cancel';
        }

        if (!$window.isPhoneGap) {
          callbackFn($window.confirm(message) ? 1 : 2);
          return;
        }

        navigator.notification.confirm(
                message,       // message
                callbackFn,    // callback to invoke with index of button pressed
                title,         // title
                buttonLabels.split(',')   // buttonLabels
            );
      },
      prompt: function (message, callbackFn, title, defaultText, buttonLabels) {
        if (gsn.isNull(buttonLabels, null) === null) {
          buttonLabels = 'OK,Cancel';
        }
        if (gsn.isNull(defaultText, null) === null) {
          defaultText = '';
        }

        if (!$window.isPhoneGap) {
          var answer = $window.prompt(message, defaultText);
          callbackFn({
            buttonIndex: (answer ? 1 : 2),
            input1: answer
          });
          return;
        }

        navigator.notification.prompt(
           message,        // message
           callbackFn,     // callback to invoke
           title,          // title
           buttonLabels.split(','),
           defaultText
       );
      }
    };

    return service;

    //#region Internal Methods        

    //#endregion
  }]);

  // FeedService: google feed
  myModule.factory('FeedService', ['$http', 'gsnApi', function ($http, gsnApi) {
    return {
      parseFeed: function (url, maxResult) {
        return $http.jsonp('//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=' + gsnApi.isNull(maxResult, 50) + '&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));
      }
    };
  }]);

  // gsnAuthenticationHandler to handle expired refresh token
  myModule.factory('gsnAuthenticationHandler', ['$rootScope', '$q', function ($rootScope, $q) {
    var service = {
      responseError: function (response, code) {
        // intercept 401
        if (response.status == 401) {
          $rootScope.$broadcast('gsnevent:auth-expired', arguments);
        } else if (response.status == 400) {
          if (response.data && typeof response.data == 'string') {
            if ((response.data.indexOf('refresh_token is invalid or has expired') > -1) || (response.data.indexOf('Illegal attempt to refresh an anonymous token for user that is no longer anonymous.') > -1)) {
              $rootScope.$broadcast('gsnevent:auth-invalidrefresh', arguments);
            }
          }
        }

        // do something on error
        return $q.reject(response);
      }
    };

    return service;
    //#region Internal Methods        

    //#endregion
  }]);

  myModule.directive('bsDisplayMode', ['$window', '$timeout', function ($window, $timeout) {
    return {
      template: '<div class="visible-xs"></div><div class="visible-sm"></div><div class="visible-md"></div><div class="visible-lg"></div>',
      restrict: 'EA',
      replace: false,
      link: function (scope, elem, attrs) {
        var markers = elem.find('div');

        function update() {
          angular.forEach(markers, function (element) {
            if (angular.element(element).is(":visible")) {
              scope[attrs.bsDisplayMode] = element.className;
            }
          });
        }

        angular.element($window).bind('resize', function () {
          // use timeout to overcome scope apply
          $timeout(update, 300);
        });

        update();
      }
    };
  }]);

  myModule.directive('scrollTo', ['$location', function ($location) {
    return function(scope, element, attrs) {

      element.bind('click', function(event) {
          event.stopPropagation();
          var off = scope.$on('$locationChangeStart', function(ev) {
              off();
              ev.preventDefault();
          });
          var location = attrs.scrollTo;
          $location.hash(location);
      });
    };
  }]);

  myModule.directive('ngScrollTop', ['$window', '$timeout', function ($window, $timeout) {
    var directive = {
      link: link,
      restrict: 'A',
    };

    // if more than 1 scrollTop on page - disable show/hide of element
    var countScrollTop = 0;
    
    return directive;
    
    function link(scope, element, attrs) {
      countScrollTop++;
      var scrollTop = parseInt(angular.element($window).scrollTop());
      scope[attrs.ngScrollTop] = scrollTop;
      
      angular.element($window).on('scroll', function () {
        
        $timeout(function () {
          // else use timeout to overcome scope apply
          scrollTop = parseInt(angular.element($window).scrollTop());
          scope[attrs.ngScrollTop] = scrollTop;

          element.css({ 'display': ((scrollTop > parseInt(attrs.offset)) && countScrollTop == 1) ? 'block' : '' });
        }, 300);
      });

      element.on('click', function () {
        angular.element($window).scrollTop(0);
      });
      
      scope.$on('$destroy', function() {
         countScrollTop--;
      });
    }
  }]);

  myModule.directive('stopEvent', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind(attr.stopEvent, function (e) {
                e.stopPropagation();
            });
        }
    };
  });

})(angular);