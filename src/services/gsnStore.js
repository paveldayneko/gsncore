(function (angular, undefined) {
  'use strict';
  var serviceId = 'gsnStore';
  angular.module('gsn.core').service(serviceId, ['$rootScope', '$http', 'gsnApi', '$q', '$window', '$timeout', '$sessionStorage', '$localStorage', '$location', gsnStore]);

  function gsnStore($rootScope, $http, gsnApi, $q, $window, $timeout, $sessionStorage, $localStorage, $location) {
    var returnObj = {};

    $rootScope[serviceId] = returnObj;

    // cache current user selection
    var $localCache = {
      manufacturerCoupons: {},
      instoreCoupons: {},
      youtechCoupons: {},
      quickSearchItems: {},
      topRecipes: {},
      faAskTheChef: {},
      faCookingTip: {},
      faArticle: {},
      faRecipe: {},
      faVideo: {},
      mealPlanners: {},
      manuCouponTotalSavings: {},
      states: {},
      adPods: {},
      specialAttributes: {},
      circular: null,
      storeList: null,
      rewardProfile: {},
      allVideos: []
    };

    var betterStorage = {};

    // cache current processed circular data
    var $circularProcessed = {
      circularByTypeId: {},
      categoryById: {},
      itemsById: {},
      staticCircularById: {},
      storeCouponById: {},
      manuCouponById: {},
      youtechCouponById: {},
      lastProcessDate: 0    // number represent a date in month
    };

    var $previousGetStore,
        processingQueue = [];

    // get circular by type id
    returnObj.getCircular = function (circularTypeId) {
      var result = $circularProcessed.circularByTypeId[circularTypeId];
      return result;
    };

    // get all categories
    returnObj.getCategories = function () {
      return $circularProcessed.categoryById;
    };

    // get inventory categories
    returnObj.getInventoryCategories = function () {
      var url = gsnApi.getStoreUrl() + '/GetInventoryCategories/' + gsnApi.getChainId() + '/' + gsnApi.getSelectedStoreId();
      return gsnApi.http({}, url);
    };

    // get sale item categories
    returnObj.getSaleItemCategories = function () {
      var url = gsnApi.getStoreUrl() + '/GetSaleItemCategories/' + gsnApi.getChainId() + '/' + gsnApi.getSelectedStoreId();
      return gsnApi.http({}, url);
    };

    // refresh current store circular
    returnObj.refreshCircular = function () {
      if ($localCache.circularIsLoading) return;
      var config = gsnApi.getConfig();
      if (config.AllContent) {
        $localCache.circularIsLoading = true;
        processCircularData(function(){
          $localCache.circularIsLoading = false;
        });
        return;
      }

      $localCache.storeId = gsnApi.getSelectedStoreId();
      if ($localCache.storeId <= 0 ) return;

      $localCache.circular = {};
      $localCache.circularIsLoading = true;
      $rootScope.$broadcast("gsnevent:circular-loading");

      var url = gsnApi.getStoreUrl() + '/AllContent/' + $localCache.storeId;
      gsnApi.http({}, url).then(function (rst) {
        if (rst.success) {
          $localCache.circular = rst.response;
          betterStorage.circular = rst.response;

          // resolve is done inside of method below
          processCircularData();
          $localCache.circularIsLoading = false;
        } else {
          $localCache.circularIsLoading = false;
          $rootScope.$broadcast("gsnevent:circular-failed", rst);
        }
      });
    };


    returnObj.searchProducts = function (searchTerm) {
      var url = gsnApi.getStoreUrl() + '/SearchProduct/' + gsnApi.getSelectedStoreId() + '?q=' + encodeURIComponent(searchTerm);
      return gsnApi.http({}, url);
    };

    returnObj.searchRecipes = function (searchTerm) {
      var url = gsnApi.getStoreUrl() + '/SearchRecipe/' + gsnApi.getChainId() + '?q=' + encodeURIComponent(searchTerm);
      return gsnApi.http({}, url);
    };

    returnObj.getAvailableVarieties = function (circularItemId) {
      var url = gsnApi.getStoreUrl() + '/GetAvailableVarieties/' + circularItemId;
      return gsnApi.http({}, url);
    };

    returnObj.getQuickSearchItems = function () {
      var url = gsnApi.getStoreUrl() + '/GetQuickSearchItems/' + gsnApi.getChainId();
      return gsnApi.http($localCache.quickSearchItems, url);
    };

    // get all stores from cache
    returnObj.getStores = function () {
      var deferred = $q.defer();
      if (gsnApi.isNull($previousGetStore, null) !== null) {
        return $previousGetStore.promise;
      }

      $previousGetStore = deferred;
      var storeList = betterStorage.storeList;
      if (gsnApi.isNull(storeList, []).length > 0) {
        $timeout(function () {
          $previousGetStore = null;
          deferred.resolve({ success: true, response: storeList });
          parseStoreList(storeList);
        }, 10);
      } else {
        $rootScope.$broadcast("gsnevent:storelist-loading");
        gsnApi.getAccessToken().then(function () {
          var url = gsnApi.getStoreUrl() + '/List/' + gsnApi.getChainId();
          $http.get(url, { headers: gsnApi.getApiHeaders() }).success(function (response) {
            $previousGetStore = null;
            var stores = response;
            parseStoreList(stores, true);
            deferred.resolve({ success: true, response: stores });
            $rootScope.$broadcast("gsnevent:storelist-loaded");
          });
        });
      }

      return deferred.promise;
    };

    // get the current store
    returnObj.getStore = function () {
      var deferred = $q.defer();
      returnObj.getStores().then(function (rsp) {
        var data = gsnApi.mapObject(rsp.response, 'StoreId');
        var result = data[gsnApi.getSelectedStoreId()];
        deferred.resolve(result);
      });

      return deferred.promise;
    };

    // get item by id
    returnObj.getItem = function (id) {
      var result = $circularProcessed.itemsById[id];
      return (gsn.isNull(result, null) !== null) ? result : null;
    };

    returnObj.getAskTheChef = function () {
      var url = gsnApi.getStoreUrl() + '/FeaturedArticle/' + gsnApi.getChainId() + '/1';
      return gsnApi.http($localCache.faAskTheChef, url);
    };

    returnObj.getFeaturedArticle = function () {
      var url = gsnApi.getStoreUrl() + '/FeaturedArticle/' + gsnApi.getChainId() + '/2';
      return gsnApi.http($localCache.faArticle, url);
    };

    returnObj.getFeaturedVideo = function () {
      var url = gsnApi.getStoreUrl() + '/FeaturedVideo/' + gsnApi.getChainId();
      return gsnApi.http($localCache.faVideo, url);
    };

    returnObj.getRecipeVideos = function() {
      var url = gsnApi.getStoreUrl() + '/RecipeVideos/' + gsnApi.getChainId();
      return gsnApi.http($localCache.allVideos, url);
    };

    returnObj.getCookingTip = function () {
      var url = gsnApi.getStoreUrl() + '/FeaturedArticle/' + gsnApi.getChainId() + '/3';
      return gsnApi.http($localCache.faCookingTip, url);
    };

    returnObj.getTopRecipes = function () {
      var url = gsnApi.getStoreUrl() + '/TopRecipes/' + gsnApi.getChainId() + '/' + 50;
      return gsnApi.http($localCache.topRecipes, url);
    };

    returnObj.getFeaturedRecipe = function () {
      var url = gsnApi.getStoreUrl() + '/FeaturedRecipe/' + gsnApi.getChainId();
      return gsnApi.http($localCache.faRecipe, url);
    };

    returnObj.getCoupon = function (couponId, couponType) {
      return couponType == 2 ? $circularProcessed.manuCouponById[couponId] : (couponType == 10 ? $circularProcessed.storeCouponById[couponId] : $circularProcessed.youtechCouponById[couponId]);
    };

    returnObj.getManufacturerCoupons = function () {
      return $localCache.manufacturerCoupons;
    };

    returnObj.getManufacturerCouponTotalSavings = function () {
      var url = gsnApi.getStoreUrl() + '/GetManufacturerCouponTotalSavings/' + gsnApi.getChainId();
      return gsnApi.http($localCache.manuCouponTotalSavings, url);
    };

    returnObj.getStates = function () {
      var url = gsnApi.getStoreUrl() + '/GetStates';
      return gsnApi.http($localCache.states, url);
    };

    returnObj.getInstoreCoupons = function () {
      return $localCache.instoreCoupons;
    };

    returnObj.getYoutechCoupons = function () {
      return $localCache.youtechCoupons;
    };

    returnObj.getRecipe = function (recipeId) {
      var url = gsnApi.getStoreUrl() + '/RecipeBy/' + recipeId;
      return gsnApi.http({}, url);
    };

    returnObj.getStaticContent = function (contentName) {
      var url = gsnApi.getStoreUrl() + '/GetPartials/' + gsnApi.getChainId() + '/';
      var storeId = gsnApi.isNull(gsnApi.getSelectedStoreId(), 0);
      if (storeId > 0) {
        url += storeId + '/';
      }
      url += '?name=' + encodeURIComponent(contentName);

      return gsnApi.http({}, url);
    };

    returnObj.getPartial = function (contentName) {
      var url = gsnApi.getContentServiceUrl('GetPartial');
      url += '?name=' + encodeURIComponent(contentName);

      return gsnApi.http({}, url);
    };

    returnObj.getArticle = function (articleId) {
      var url = gsnApi.getStoreUrl() + '/ArticleBy/' + articleId;
      return gsnApi.http({}, url);
    };

    returnObj.getSaleItems = function (departmentId, categoryId) {
      var url = gsnApi.getStoreUrl() + '/FilterSaleItem/' + gsnApi.getSelectedStoreId() + '?' + 'departmentId=' + gsnApi.isNull(departmentId, '') + '&categoryId=' + gsnApi.isNull(categoryId, '');
      return gsnApi.http({}, url);
    };

    returnObj.getInventory = function (departmentId, categoryId) {
      var url = gsnApi.getStoreUrl() + '/FilterInventory/' + gsnApi.getSelectedStoreId() + '?' + 'departmentId=' + gsnApi.isNull(departmentId, '') + '&categoryId=' + gsnApi.isNull(categoryId, '');
      return gsnApi.http({}, url);
    };

    returnObj.getSpecialAttributes = function () {
      var url = gsnApi.getStoreUrl() + '/GetSpecialAttributes/' + gsnApi.getChainId();
      return gsnApi.http($localCache.specialAttributes, url);
    };

    returnObj.getMealPlannerRecipes = function () {
      var url = gsnApi.getStoreUrl() + '/GetMealPlannerRecipes/' + gsnApi.getChainId();
      return gsnApi.http($localCache.mealPlanners, url);
    };

    returnObj.getAdPods = function () {
      var url = gsnApi.getStoreUrl() + '/ListSlots/' + gsnApi.getChainId();
      return gsnApi.http($localCache.adPods, url);
    };

    // similar to getStores except the data is from cache
    returnObj.getStoreList = function () {
      if (gsnApi.isNull($localCache.storeList, null) === null) {
        $localCache.storeList = betterStorage.storeList;
      }

      return $localCache.storeList;
    };

    returnObj.hasCompleteCircular = function () {
      var circ = returnObj.getCircularData();
      var result = false;
      if (circ) {
        result = gsnApi.isNull(circ.Circulars, false);
      }

      if (!result && (gsnApi.isNull(gsnApi.getSelectedStoreId(), 0) > 0)) {
        returnObj.refreshCircular();
        result = false;
      }

      return result;
    };

    returnObj.getCircularData = function (forProcessing) {
      if (!$localCache.circular) {
        $localCache.circular = betterStorage.circular;
        if (!forProcessing) {
          processCircularData();
        }
      }

      return $localCache.circular;
    };

    returnObj.initialize = function (isApi) {
      /// <summary>Initialze store data. this method should be
      /// written such that, it should do a server retrieval when parameter is null.
      /// </summary>

      if (gsnApi.getUseLocalStorage()) {
        betterStorage = $localStorage;
      }

      gsnApi.initApp();

      // call api to get stores
      var config = gsnApi.getConfig();
      var rawStoreList = config.StoreList;
      if (rawStoreList) {
        parseStoreList(rawStoreList, true);
      }

      returnObj.getStores();
      if (config.AllContent) {
        config.AllContent.Circularz = config.AllContent.Circulars;
        config.AllContent.Circulars = [];
        angular.forEach(config.AllContent.Circularz, function(circ) {
          circ.Pagez = circ.Pages;
          circ.Pages = [];
        });

        betterStorage.circular = config.AllContent;
      }

      if (returnObj.hasCompleteCircular()) {
        // async init data
        $timeout(processCircularData, 0);
      }

      if (gsnApi.isNull(isApi, null) !== null) {
        returnObj.getAdPods();
        returnObj.getManufacturerCouponTotalSavings();
      }


      var gourl = ($location.search()).gourl || ($location.search()).goUrl;
      if (gourl) {
        gsnApi.goUrl(gourl);
      }
    };

    $rootScope.$on('gsnevent:store-setid', function (event, values) {
      var storeId = values.newValue;
      var config = gsnApi.getConfig();
      var hasNewStoreId = (gsnApi.isNull($localCache.storeId, 0) != storeId);
      var requireRefresh = hasNewStoreId && !config.AllContent;

      // attempt to load circular
      if (hasNewStoreId) {
        $localCache.storeId = storeId;
        $localCache.circularIsLoading = false;
      }

      // always call update circular on set storeId or if it has been more than 20 minutes
      var currentTime = new Date().getTime();
      var seconds = (currentTime - gsnApi.isNull(betterStorage.circularLastUpdate, 0)) / 1000;
      if ((requireRefresh && !$localCache.circularIsLoading) || (seconds > 1200)) {
        returnObj.refreshCircular();
      }
      else if (hasNewStoreId) {
        processCircularData();
      }
    });

    return returnObj;

    //#region helper methods
    function parseStoreList(storeList, isRaw) {
      if (isRaw) {
        var stores = storeList;
        if (typeof (stores) != "string") {
          angular.forEach(stores, function (store) {
            store.Settings = gsnApi.mapObject(store.StoreSettings, 'StoreSettingId');
          });

          betterStorage.storeList = stores;
        }
      }
      var search = $location.search();
      var selectFirstStore = search.sft || search.selectFirstStore || search.selectfirststore;
      storeList = gsnApi.isNull(storeList, []);
      if (storeList.length == 1 || selectFirstStore) {
        if (storeList[0].StoreId != gsnApi.isNull(gsnApi.getSelectedStoreId(), 0)) {
          gsnApi.setSelectedStoreId(storeList[0].StoreId);
        }
      }
    }

    function processManufacturerCoupon() {
      if (gsnApi.isNull($localCache.manufacturerCoupons.items, []).length > 0) return;

      // process manufacturer coupon
      var circular = returnObj.getCircularData();
      $localCache.manufacturerCoupons.items = circular.ManufacturerCoupons;
      angular.forEach($localCache.manufacturerCoupons.items, function (item) {
        item.CategoryName = gsnApi.isNull($circularProcessed.categoryById[item.CategoryId], { CategoryName: '' }).CategoryName;
        $circularProcessed.manuCouponById[item.ItemId] = item;
      });
      gsnApi.getConfig().hasPrintableCoupon = $localCache.manufacturerCoupons.items.length > 0;
    }

    function processInstoreCoupon() {
      var circular = returnObj.getCircularData();
      // process in-store coupon
      var items = [];
      angular.forEach(circular.InstoreCoupons, function (item) {
        if (item.StoreIds.length <= 0 || item.StoreIds.indexOf($localCache.storeId) >= 0) {
          item.CategoryName = gsnApi.isNull($circularProcessed.categoryById[item.CategoryId], { CategoryName: '' }).CategoryName;
          $circularProcessed.storeCouponById[item.ItemId] = item;
          items.push(item);
        }
      });

      gsnApi.getConfig().hasStoreCoupon = items.length > 0;

      $localCache.instoreCoupons.items = items;
    }

    function processYoutechCoupon() {
      if (gsnApi.isNull($localCache.youtechCoupons.items, []).length > 0) return;

      var circular = returnObj.getCircularData();

      // process youtech coupon
      $localCache.youtechCoupons.items = circular.YoutechCoupons;
      angular.forEach($localCache.youtechCoupons.items, function (item) {
        item.CategoryName = gsnApi.isNull($circularProcessed.categoryById[item.CategoryId], {CategoryName: ''}).CategoryName;
        $circularProcessed.youtechCouponById[item.ItemId] = item;
      });

      gsnApi.getConfig().hasDigitalCoupon = $localCache.youtechCoupons.items.length > 0;
    }

    function processCoupon() {
      if ($circularProcessed) {
        $timeout(processManufacturerCoupon, 50);
        $timeout(processInstoreCoupon, 50);
        $timeout(processYoutechCoupon, 50);
      }
    }

    function processCircularData(cb) {
      var circularData = returnObj.getCircularData(true);
      if (!circularData) return;
      if (!circularData.CircularTypes) return;

      betterStorage.circularLastUpdate = new Date().getTime();
      $localCache.storeId = gsnApi.getSelectedStoreId();
      processingQueue.length = 0;

      // process category into key value pair
      processingQueue.push(function () {
        if ($circularProcessed.lastProcessDate == (new Date().getDate()) && $circularProcessed.categoryById[-1]) return;

        var categoryById = gsnApi.mapObject(circularData.Categories, 'CategoryId');

        categoryById[null] = { CategoryId: null, CategoryName: '' };
        categoryById[-1] = { CategoryId: -1, CategoryName: 'Misc. Items' };
        categoryById[-2] = { CategoryId: -2, CategoryName: 'Ingredients' };
        $circularProcessed.categoryById = categoryById;

        return;
      });

      var circularTypes = gsnApi.mapObject(circularData.CircularTypes, 'Code');
      var circularByTypes = [];
      var staticCirculars = [];
      var items = [];
      var circulars = gsnApi.isNull(circularData.Circularz, circularData.Circulars);
      circularData.Circulars = [];

      // foreach Circular
      angular.forEach(circulars, function (circ) {
        circ.StoreIds = circ.StoreIds || [];
        if (circ.StoreIds.length <= 0 || circ.StoreIds.indexOf($localCache.storeId) >= 0) {
          circularData.Circulars.push(circ);
          if (!circ.Pagez) {
            circ.Pagez = circ.Pages;
          }

          var pages = circ.Pagez;
          circ.Pages = [];

          angular.forEach(pages, function (page) {
            if (page.StoreIds.length <= 0 || page.StoreIds.indexOf($localCache.storeId) >= 0) {
              circ.Pages.push(page);
            }
          });

          processCircular(circ, items, circularTypes, staticCirculars, circularByTypes);
        }
      });

      processingQueue.push(function () {
        // set all items
        circularByTypes.push({ CircularTypeId: 99, CircularType: 'All Circulars', items: items });

        return;
      });

      // set result
      processingQueue.push(function () {
        $circularProcessed.itemsById = gsnApi.mapObject(items, 'ItemId');
        return;
      });

      processingQueue.push(function () {
        $circularProcessed.circularByTypeId = gsnApi.mapObject(circularByTypes, 'CircularTypeId');
        return;
      });

      processingQueue.push(function () {
        $circularProcessed.staticCircularById = gsnApi.mapObject(staticCirculars, 'CircularTypeId');
        return;
      });

      processingQueue.push(processCoupon);

      processingQueue.push(function () {
        if (cb) cb();
        $circularProcessed.lastProcessDate = new Date().getDate();
        $rootScope.$broadcast('gsnevent:circular-loaded', { success: true, response: circularData });
        return;
      });

      processWorkQueue();
    }

    function processWorkQueue() {
      if (processingQueue.length > 0) {
        // this make sure that work get executed in sequential order
        processingQueue.shift()();

        $timeout(processWorkQueue, 50);
      }
    }

    function processCircular(circ, items, circularTypes, staticCirculars, circularByTypes) {
      // process pages
      var pages = circ.Pages;
      var itemCount = 0;
      gsnApi.sortOn(pages, 'PageNumber');
      circ.pages = pages;
      circ.CircularType = circularTypes[circ.CircularTypeId].Name;
      var circularMaster = {
        CircularPageId: pages[0].CircularPageId,
        CircularType: circ.CircularType,
        CircularTypeId: circ.CircularTypeId,
        ImageUrl: pages[0].ImageUrl,
        SmallImageUrl: pages[0].SmallImageUrl,
        items: []
      };

      // foreach Page in Circular
      angular.forEach(pages, function (page) {
        itemCount += page.Items.length;

        processingQueue.push(function () {
          processCircularPage(items, circularMaster, page);
        });
      });

      processingQueue.push(function () {
        if (gsnApi.isNull(itemCount, 0) > 0) {
          circularByTypes.push(circularMaster);
        } else {
          circularMaster.items = pages;
          staticCirculars.push(circularMaster);
        }
      });
    }

    function processCircularPage(items, circularMaster, page) {
      // foreach Item on Page
      angular.forEach(page.Items, function (item) {
        circularMaster.items.push(item);
        items.push(item);
      });
    }
    //#endregion
  }
})(angular);
