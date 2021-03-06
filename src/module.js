(function(gsn, angular, undefined) {
  'use strict';

  /* fake definition of angular-facebook if there is none */
  angular.module('facebook', []).provider('Facebook', function test() {
    return {
      init: function() {},
      $get: function() {
        return new test();
      }
    };
  });
  angular.module('ui.map', []);
  angular.module('ui.event', []);
  angular.module('ui.utils', []);
  angular.module('ui.keypress', []);
  angular.module('chieffancypants.loadingBar', []);

  var serviceId = 'gsnApi';
  var mygsncore = angular.module('gsn.core', ['ngRoute', 'ngSanitize', 'facebook', 'angulartics', 'ui.event']);

  mygsncore.config(['$locationProvider', '$sceDelegateProvider', '$sceProvider', '$httpProvider', 'FacebookProvider', '$analyticsProvider',
    function($locationProvider, $sceDelegateProvider, $sceProvider, $httpProvider, FacebookProvider, $analyticsProvider) {
      gsn.init($locationProvider, $sceDelegateProvider, $sceProvider, $httpProvider, FacebookProvider, $analyticsProvider)
    }
  ])
    .run(['$rootScope', 'gsnGlobal', 'gsnApi', '$window', function($rootScope, gsnGlobal, gsnApi, $window) {
      var head = angular.element('head');
      var myHtml = '<!--[if lt IE 10]>\n' +
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7/html5shiv.min.js"></script>' +
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/es5-shim/2.2.0/es5-shim.min.js"></script>' +
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/json2/20130526/json2.min.js"></script>' +
        '\n<![endif]-->';
      head.append(myHtml);

      $rootScope.siteMenu = gsnApi.getConfig().SiteMenu;
      $rootScope.win = $window;
      gsnGlobal.init(true);
    }]);

  mygsncore.service(serviceId, ['$rootScope', '$window', '$timeout', '$q', '$http', '$location', '$localStorage', '$sce', gsnApi]);

  function gsnApi($rootScope, $window, $timeout, $q, $http, $location, $localStorage, $sce) {
    var returnObj = {
      previousDefer: null
    };
    var profileStorage = $localStorage;

    $rootScope[serviceId] = returnObj;
    //#region gsn pass-through methods
    returnObj.gsn = gsn;
    gsn.$api = returnObj;

    // return defaultValue if null - isNull(val, defaultIfNull)
    returnObj.isNull = gsn.isNull;

    // return defaultValue if NaN - isNaN(val, defaultIfNaN)
    returnObj.isNaN = gsn.isNaN;

    // sort a collection base on a field name - sortOn(list, 'field')
    returnObj.sortOn = gsn.sortOn;

    // group a list by a field name/attribute - groupBy(list, 'key') - result array with (key, items) property
    returnObj.groupBy = gsn.groupBy;

    // map a list to object, similar to reduce method - mapObject(list, 'key') - result object by key as id
    returnObj.mapObject = gsn.mapObject;

    // iterator method - forEach(list, function(v,k,list));
    returnObj.forEach = angular.forEach;

    // shallow extend method - extend(dest, src)
    returnObj.extend = gsn.extend;

    returnObj.keys = gsn.keys;

    returnObj.getContentUrl = function(url) {
      return $sce.trustAsResourceUrl(gsn.getContentUrl(url));
    };

    returnObj.getThemeUrl = function(url) {
      return $sce.trustAsResourceUrl(gsn.getThemeUrl(url));
    };

    returnObj.cleanKeyword = gsn.cleanKeyword;

    returnObj.loadIframe = gsn.loadIframe;

    returnObj.loadScripts = gsn.loadScripts;

    returnObj.userAgent = gsn.userAgent;

    returnObj.browser = gsn.browser;

    returnObj.parsePartialContentData = gsn.parsePartialContentData;

    returnObj.del = gsn.del;
    //#endregion

    //#region gsn.config pass-through
    returnObj.getConfig = function() {
      return gsn.config;
    };

    returnObj.getApiUrl = gsn.getApiUrl;

    returnObj.getStoreUrl = function() {
      return gsn.config.StoreServiceUrl;
    };

    returnObj.getContentServiceUrl = function(method) {
      var url = gsn.getContentServiceUrl('/' + method + '/' + returnObj.getChainId() + '/' + returnObj.isNull(returnObj.getSelectedStoreId(), '0') + '/');
      if (gsn.config.useProxy) {
        url = url.replace('clientapi.gsn2.com/', '/').replace('https://', '').replace('http://', '');
        url = url.replace('clientapix.gsn2.com/', '/').replace('/api/v1', '/proxy');
        return url;
      }

      return url.replace('clientapi.gsn2.com/', 'clientapi.gsngrocers.com/').replace('https://', $location.protocol() + '://');
    };

    returnObj.getDefaultLayout = function(defaultUrl) {
      if (gsn.config.DefaultLayout) {
        return $sce.trustAsResourceUrl(gsn.config.DefaultLayout);
      }
      return defaultUrl;
    }

    returnObj.getYoutechCouponUrl = function() {
      return gsn.config.YoutechCouponUrl;
    };

    returnObj.getRoundyProfileUrl = function() {
      return gsn.config.RoundyProfileUrl;
    };

    returnObj.getProductServiceUrl = function() {
      return gsn.config.ProductServiceUrl;
    };

    returnObj.getShoppingListApiUrl = function() {
      return gsn.config.ShoppingListServiceUrl;
    };

    returnObj.getProfileApiUrl = function() {
      return gsn.config.ProfileServiceUrl;
    };

    returnObj.getLoggingApiUrl = function() {
      return gsn.config.LoggingServiceUrl;
    };

    returnObj.getMidaxServiceUrl = function() {
      return gsn.config.MidaxServiceUrl;
    };

    returnObj.getUseLocalStorage = function() {
      return returnObj.isNull(gsn.config.UseLocalStorage, false);
    };

    returnObj.getVersion = function() {
      /// <summary>Get the application version</summary>

      return gsn.config.Version;
    };

    returnObj.getGoogleSiteSearchCode = function() {
      return gsn.config.GoogleSiteSearchCode;
    };

    returnObj.getGoogleSiteVerificationId = function() {
      return gsn.config.GoogleSiteVerificationId;
    };

    returnObj.isBetween = function(value, min, max) {
      return value > min && value < max;
    };

    returnObj.getFacebookPermission = function() {
      // if empty, get at least email permission
      return returnObj.isNull(gsn.config.FacebookPermission, 'email');
    };

    returnObj.getGoogleAnalyticAccountId1 = function() {
      return returnObj.isNull(gsn.config.GoogleAnalyticAccountId1, '');
    };

    returnObj.getGoogleAnalyticAccountId2 = function() {
      return returnObj.isNull(gsn.config.GoogleAnalyticAccountId2, '');
    };

    returnObj.getEmailRegEx = function() {
      return gsn.config.EmailRegex;
    };

    returnObj.getDfpNetworkId = function() {
      return gsn.config.DfpNetworkId;
    };

    returnObj.getServiceUnavailableMessage = function() {
      return gsn.config.ServiceUnavailableMessage;
    };

    returnObj.getChainId = function() {
      return gsn.config.ChainId;
    };

    returnObj.getChainName = function() {
      return gsn.config.ChainName;
    };

    returnObj.getHomeData = function() {
      return gsn.config.HomePage;
    };

    returnObj.getRegistrationFromEmailAddress = function() {
      return gsn.config.RegistrationFromEmailAddress;
    };

    returnObj.htmlFind = function(html, find) {
      return angular.element('<div>' + html + '</div>').find(find).length;
    };

    returnObj.equalsIgnoreCase = function(val1, val2) {
      return angular.lowercase(val1) == angular.lowercase(val2);
    };

    returnObj.toLowerCase = function(str) {
      return angular.lowercase(str);
    };

    returnObj.goUrl = function(url, target) {
      /// <summary>go to url</summary>

      try {
        // attempt to hide any modal
        angular.element('.modal').modal('hide');
      } catch (e) {}

      target = returnObj.isNull(target, '');

      if (target == '_blank') {
        $window.open(url, '');
        return;
      } else if (target == '_reload' || target == '_self') {
        if ($window.top) {
          try {
            $window.top.location = url;
          } catch (e) {
            $window.location = url;
          }
        } else {
          $window.location = url;
        }

        return;
      }

      $timeout(function() {
        // allow external call to be in scope apply
        $location.url(url);
      }, 5);
    };

    returnObj.reload = function() {
      returnObj.goUrl($location.url(), '_reload');
    };

    // allow external code to change the url of angular app
    gsn.goUrl = returnObj.goUrl;
    //#endregion

    returnObj.clearSelection = function(items) {
      angular.forEach(items, function(item) {
        item.selected = false;
      });
    };

    returnObj.getBindableItem = function(newItem) {
      var item = angular.copy(newItem);
      item.NewQuantity = item.Quantity || 1;
      if ($rootScope.gsnProfile) {
        var shoppingList = $rootScope.gsnProfile.getShoppingList();
        if (shoppingList) {
          var result = shoppingList.getItem(item);
          return result || item;
        }
      }

      return item;
    };

    returnObj.updateBindableItem = function(item) {
      if (item.ItemId) {
        if ($rootScope.gsnProfile) {
          var shoppingList = $rootScope.gsnProfile.getShoppingList();
          if (shoppingList) {
            item.OldQuantity = item.Quantity;
            item.Quantity = parseInt(item.NewQuantity);
            shoppingList.syncItem(item);
          }
        }
      }
    };

    returnObj.doSiteSearch = function(search) {
      returnObj.goUrl('/search?q=' + encodeURIComponent(search));
    };

    returnObj.doItemSearch = function(search) {
      returnObj.goUrl('/product/search?q=' + encodeURIComponent(search));
    };

    returnObj.decodeServerUrl = function(url) {
      /// <summary>decode url path returned by our server</summary>
      /// <param name="url" type="Object"></param>

      return decodeURIComponent((url + '').replace(/\s+$/, '').replace(/\s+/gi, '-').replace(/(.aspx)$/, ''));
    };

    returnObj.parseStoreSpecificContent = function(contentData) {
      var contentDataResult = {};
      var possibleResult = [];
      var myContentData = contentData;
      var allStoreCount = gsn.config.StoreList.length;
      var storeId = returnObj.isNull(returnObj.getSelectedStoreId(), 0);

      // determine if contentData is array
      if (contentData && contentData.Id) {
        myContentData = [contentData];
      }

      var i = 0;
      angular.forEach(myContentData, function(v, k) {
        var storeIds = returnObj.isNull(v.StoreIds, []);

        // get first content as default or value content without storeids
        if (i <= 0 && storeIds.length <= 0) {
          contentDataResult = v;
        }
        i++;

        if (storeId <= 0) {
          if (allStoreCount == v.StoreIds.length) {
            contentDataResult = v;
          }

          return;
        }

        angular.forEach(storeIds, function(v1, k1) {
          if (storeId == v1) {
            contentDataResult = v;
            possibleResult.push(v);
          }
        });
      });

      var maxStoreIdCount = allStoreCount;
      if (possibleResult.length > 1) {
        // use result with least number of stores
        angular.forEach(possibleResult, function(v, k) {
          if (v.StoreIds.length > 1 && v.StoreIds.length < maxStoreIdCount) {
            maxStoreIdCount = v.StoreIds.length;
            contentDataResult = v;
          }
        });
      }

      return contentDataResult;
    };

    returnObj.getThemeContent = function(contentPosition) {
      return returnObj.parseStoreSpecificContent(returnObj.getHomeData().ContentData[contentPosition]);
    };

    returnObj.getThemeConfig = function(name) {
      return returnObj.parseStoreSpecificContent(returnObj.getHomeData().ConfigData[name]);
    };

    returnObj.getThemeConfigDescription = function(name, defaultValue) {
      var resultObj = returnObj.getThemeConfig(name).Description;
      return returnObj.isNull(resultObj, defaultValue);
    };

    returnObj.getFullPath = function(path, includePort) {
      var normalizedPath = (returnObj.isNull(path, '') + '').replace(/$\/+/gi, '');
      if (normalizedPath.indexOf('http') > -1) {
        return path;
      }
      if ($location.host() == 'localhost') {
        includePort = true;
      }

      normalizedPath = ($location.protocol() + '://' + $location.host() + (includePort ? ':' + $location.port() : '') + ('/' + normalizedPath).replace(/(\/\/)+/gi, '\/'));
      return normalizedPath;
    };

    returnObj.getPageCount = function(data, pageSize) {
      data = data || [];
      return (Math.ceil(data.length / pageSize) || 1);
    };

    //#region storeId, shoppingListId, anonymousToken, etc...
    returnObj.getSelectedStoreId = function() {
      return profileStorage.storeId || 0;
    };

    returnObj.setSelectedStoreId = function(storeId, newUrl, timeout) {
      // make sure we don't set a bad store id
      var storeIdInt = parseInt(storeId);
      if (returnObj.isNaN(storeIdInt, 0) <= 0) {
        storeId = null;
      }

      var previousStoreId = profileStorage.storeId;
      profileStorage.storeId = storeId;
      $rootScope.$broadcast('gsnevent:store-setid', {
        newValue: storeId,
        oldValue: previousStoreId
      });
      if (newUrl) {
        $timeout(function() {
          returnObj.goUrl(newUrl, '_reload')
        }, timeout || 500);
      }
    };

    returnObj.getProfileId = function() {
      var accessToken = getAccessToken();
      return returnObj.isNaN(parseInt(returnObj.isNull(accessToken.user_id, 0)), 0);
    };

    returnObj.getShoppingListId = function() {
      return returnObj.isNull(profileStorage.shoppingListId, 0);
    };

    returnObj.setShoppingListId = function(shoppingListId, dontBroadcast) {
      profileStorage.shoppingListId = returnObj.isNull(shoppingListId, 0);

      if (dontBroadcast) return;

      $rootScope.$broadcast('gsnevent:shoppinglist-setid', shoppingListId);
    };
    //#endregion

    returnObj.getApiHeaders = function() {
      // assume access token data is available at this point
      var accessTokenData = getAccessToken();
      var payload = {
        site_id: returnObj.getChainId(),
        store_id: returnObj.getSelectedStoreId(),
        profile_id: returnObj.getProfileId(),
        access_token: accessTokenData.access_token,
        'Content-Type': 'application/json'
      };

      return payload;
    };

    returnObj.isAnonymous = function() {
      /// <summary>Determine if a user is logged in.</summary>

      var accessTokenData = getAccessToken();

      return returnObj.isNull(accessTokenData.grant_type, '') == 'anonymous';
    };

    returnObj.isLoggedIn = function() {
      /// <summary>Determine if a user is logged in.</summary>

      var accessTokenData = getAccessToken();

      return returnObj.isNull(accessTokenData.grant_type, '') == 'password';
    };

    gsn.isLoggedIn = returnObj.isLoggedIn;
    gsn.getUserId = returnObj.getProfileId;

    returnObj.logOut = function() {
      /// <summary>Log a user out.</summary>

      // attempt to reset to anonymous token
      var previousProfileId = returnObj.getProfileId();
      var data = getAnonymousToken();
      setAccessToken(data);

      // if invalid anonymous token, cause a login
      if (returnObj.isNull(data.expires_dt, 0) <= 0) {

        // TODO: rethink this as it may cause infinit loop on browser if server is down
        returnObj.getAccessToken();
      }

      $rootScope.$broadcast('gsnevent:logout', {
        ProfileId: previousProfileId
      });
    };

    returnObj.doAuthenticate = function(payload) {
      if (payload) {
        if (!payload.username) {
          payload.username = returnObj.getProfileId();
        }
      }

      // make the auth call
      $http.post(gsn.config.AuthServiceUrl + "/Token2", payload, {
        headers: {
          'Content-Type': 'application/json',
          shopping_list_id: returnObj.getShoppingListId()
        }
      })
        .success(function(response) {
          // Since server automatically send grant_type ('anonymous'/'password') for refresh payload
          // DO NOT SET: response.grant_type = payload.grant_type;
          response.expires_dt = (new Date().getTime()) + 1000 * response.expires_in;

          setAccessToken(response);
          var defer = returnObj.previousDefer;
          if (defer) {
            returnObj.previousDefer = null;
            defer.resolve(response);
          }

          $rootScope.$broadcast('gsnevent:login-success', {
            success: true,
            payload: payload,
            response: response
          });
        }).error(function(response) {
        var refreshTokenFailed = (payload.grant_type == 'refresh_token' && returnObj.isNull(response.ExceptionMessage, '').indexOf('expired') > 0);

        // if refresh failed, it is being handled in 'gsnevent:auth-invalidrefresh'
        if (!refreshTokenFailed) {
          // if anonymous login failed, something must be wrong with the server
          // a message should be display on the UI side?
          $rootScope.$broadcast('gsnevent:login-failed', {
            success: true,
            payload: payload,
            response: response
          });
        }
      });
    };

    returnObj.setAccessToken = setAccessToken;

    returnObj.getAccessToken = function() {
      var deferred = returnObj.isNull(returnObj.previousDefer, null) === null ? $q.defer() : returnObj.previousDefer;

      // check access token
      var accessTokenPayload = getAccessTokenPayload();

      // if valid token, resolve
      if (returnObj.isNull(accessTokenPayload, null) === null) {
        returnObj.previousDefer = null;
        $timeout(function() {
          deferred.resolve({
            success: true,
            response: getAccessToken()
          });
        }, 10);

        return deferred.promise;
      } else {

        // do not proceed if a defer is going on
        if (returnObj.isNull(returnObj.previousDefer, null) !== null) {
          return returnObj.previousDefer.promise;
        }

        returnObj.previousDefer = deferred;
        returnObj.doAuthenticate(accessTokenPayload);
      }

      return deferred.promise;
    };

    // when it doesn't have defer
    //  -- it will create a defer and return promise
    //  -- it will make http request and call defer resolve on success
    // when it has defer or data, it will return the promise
    returnObj.http = function(cacheObject, url, payload) {
      // when it has data, it will simulate resolve and return promise
      // when it doesn't have defer, it will create a defer and trigger request
      // otherwise, just return the promise
      if (cacheObject.response) {
        // small timeout to simulate async
        $timeout(function() {
          cacheObject.deferred.resolve(cacheObject.response);
        }, 50);
      } else if (returnObj.isNull(cacheObject.deferred, null) === null) {
        cacheObject.deferred = $q.defer();
        var successHandler = function(response) {
          cacheObject.response = {
            success: true,
            response: response
          };
          cacheObject.deferred.resolve(cacheObject.response);
        };
        var errorHandler = function(response) {
          cacheObject.response = {
            success: false,
            response: response
          };
          cacheObject.deferred.resolve(cacheObject.response);
        };

        if (url.indexOf('/undefined') > 0) {
          errorHandler('Client error: invalid request.');
        } else {
          returnObj.getAccessToken().then(function() {
            cacheObject.url = url;
            if (payload) {
              $http.post(url, payload, {
                headers: returnObj.getApiHeaders()
              }).success(successHandler).error(errorHandler);
            } else {
              $http.get(url, {
                headers: returnObj.getApiHeaders()
              }).success(successHandler).error(errorHandler);
            }
          });
        }
      }

      return cacheObject.deferred.promise;
    };

    returnObj.httpGetOrPostWithCache = returnObj.http;

    returnObj.isValidCaptcha = function(challenge, response) {
      var defer = $q.defer();
      $http.post(gsn.config.AuthServiceUrl + "/ValidateCaptcha", {
        challenge: challenge,
        response: response
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .success(function(rsp) {
          defer.resolve((rsp == 'true'));
        }).error(function(rsp) {
        defer.resolve(false);
      });
      return defer.promise;
    };

    returnObj.goBack = function() {
      $timeout(function() {
        $window.history.back();
      }, 10);
    };

    returnObj.initApp = function() {
      $rootScope.appState = 'initializing';

      // injecting getContentUrl and getThemeUrl for css
      $rootScope.getContentUrl = returnObj.getContentUrl;
      $rootScope.getThemeUrl = returnObj.getThemeUrl;
      $rootScope.getContentServiceUrl = returnObj.getContentServiceUrl;

      // setting the default layout
      var configData = returnObj.getHomeData().ConfigData;
      if (configData) {
        var layoutConfig = configData.layout;
        if (layoutConfig) {
          $rootScope.defaultLayout = gsn.getThemeUrl('/views/layout' + layoutConfig.Description + '/layout.html');
        }
      }

      var accessTokenData = getAccessToken();
      var hasValidAccessToken = (returnObj.isNull(accessTokenData.expires_dt, 0) > 0 && accessTokenData.expires_dt > new Date().getTime());

      if (!hasValidAccessToken) {
        // get and set to anonymous
        var anonymousTokenData = getAnonymousToken();
        setAccessToken(anonymousTokenData);
      }

      // give the UI 2/10 of a second to be ready
      $timeout(function() {
        $rootScope.appState = 'ready';
      }, 200);
    };

    returnObj.onevent = function(fn) {
      $rootScope.$on('gsnevent:*', fn);
    };

    //#region authentication event handling
    $rootScope.$on('gsnevent:auth-expired', function(evt, args) {
      var accessTokenData = getAccessToken();

      // invalidate the token
      if (accessTokenData.access_token) {
        accessTokenData.expires_dt = 0;
        setAccessToken(accessTokenData);
      }

      // trigger authentication after token invalidation
      returnObj.getAccessToken();
    });

    $rootScope.$on('gsnevent:auth-invalidrefresh', function(evt, args) {
      var accessTokenData = getAccessToken();
      if (accessTokenData.grant_type == 'anonymous') {
        // anonymous refresh expired so clear anonymous token
        setAnonymousToken();
      } else {
        // non-anonymous refresh expired, reset current credential to anonymous
      }

      returnObj.logOut();
      returnObj.reload();
    });
    //#endregion

    return returnObj;

    //#region Internal Methods
    function getAccessTokenPayload() {
      var accessTokenData = getAccessToken();
      var hasValidAccessToken = (returnObj.isNull(accessTokenData.expires_dt, 0) > 0 && accessTokenData.expires_dt > new Date().getTime());

      if (hasValidAccessToken) {
        return null;
      }

      // payload default to anonymous authentication
      var payload = {
        grant_type: "anonymous",
        client_id: returnObj.getChainId(),
        access_type: 'offline'
      };

      // if previous accessToken as refresh_token capability, then try to refresh
      if (typeof (accessTokenData.refresh_token) != 'undefined') {
        payload.grant_type = 'refresh_token';
        payload.refresh_token = accessTokenData.refresh_token;
      }

      return payload;
    }

    function getAccessToken() {
      return returnObj.isNull(profileStorage.accessToken, {});
    }

    function setAccessToken(data) {
      profileStorage.accessToken = data || {};

      if (data) {
        var profileId = parseInt(returnObj.isNull(data.user_id, 0));
        if (returnObj.isNaN(profileId, 0) > 0) {
          $rootScope.$broadcast('gsnevent:profile-setid', profileId);
        }

        // finally store anonymous token
        if (data.grant_type == 'anonymous') {
          setAnonymousToken(data);
        }
      }
    }

    function getAnonymousToken() {
      return returnObj.isNull($localStorage.anonymousToken, {});
    }

    function setAnonymousToken(token) {
      var tk = returnObj.isNull(token, {});

      $localStorage.anonymousToken = tk;
    }

  //#endregion
  }
})(gsn, angular);
