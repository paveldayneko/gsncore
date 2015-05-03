(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlRecipeCenter';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnApi', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnStore, gsnApi) {
    $scope.activate = activate;
    $scope.vm = {
      mealPlanners: [],
      mealPlannerTeasers: [],
      quickSearchItems: [],
      videos: []
    };
    $scope.recipeSearch = { attrib: {} };

    function activate() {

      gsnStore.getRecipeVideos().then(function (result) {
        if (result.success) {
          $scope.vm.videos = result.response;
        }
      });

      gsnStore.getFeaturedVideo().then(function (result) {
        if (result.success) {
          $scope.vm.featuredVideo = result.response;
        }
      });

      gsnStore.getQuickSearchItems().then(function (rst) {
        if (rst.success) {
          gsnApi.sortOn(rst.response, 'ParentOrder');
          $scope.vm.quickSearchItems = gsnApi.groupBy(rst.response, 'ParentName');
        }
      });

      gsnStore.getTopRecipes().then(function (rst) {
        if (rst.success) {
          $scope.vm.topRecipes = rst.response;
        }
      });

      gsnStore.getFeaturedRecipe().then(function (result) {
        if (result.success) {
          $scope.vm.featuredRecipe = result.response;
        }
      });

      gsnStore.getAskTheChef().then(function (result) {
        if (result.success) {
          $scope.vm.askTheChef = result.response;
        }
      });

      gsnStore.getFeaturedArticle().then(function (result) {
        if (result.success) {
          $scope.vm.featuredArticle = result.response;
        }
      });

      gsnStore.getCookingTip().then(function (result) {
        if (result.success) {
          $scope.vm.cookingTip = result.response;
        }
      });

      gsnStore.getMealPlannerRecipes().then(function (rst) {
        if (rst.success) {
          $scope.vm.mealPlanners = gsnApi.groupBy(rst.response, 'DisplayOrderDate');

          var teasers = [];
          var i = 0;
          angular.forEach($scope.vm.mealPlanners, function (group) {
            if (i++ > 2) return;
            var g = { DisplayDate: group.items[0].DisplayDate, items: [] };
            teasers.push(g);
            var j = 0;
            angular.forEach(group.items, function (item) {
              if (j++ > 2) return;
              g.items.push(item);
            });
          });

          $scope.vm.mealPlannerTeasers = teasers;
        }
      });
    }



    $scope.doRecipeSearch = function () {
      var search = $scope.recipeSearch, attributes = '', resultString = 'SearchTerm:' + gsnApi.isNull(search.term, '') + ';';

      if (gsnApi.isNull(search.preptime, '').length > 0) {
        resultString += 'Time:' + gsnApi.isNull(search.preptime, '') + ';';
      }
      if (gsnApi.isNull(search.skilllevel, '').length > 0) {
        resultString += 'SkillLevelList:|' + gsnApi.isNull(search.skilllevel, '') + '|;';
      }

      angular.forEach(search.attrib, function (value, key) {
        if (gsnApi.isNull(value, '').length > 0) {
          attributes += value + '|';
        }
      });
      if (gsnApi.isNull(attributes, '').length > 0) {
        resultString += 'AttributeList:|' + gsnApi.isNull(attributes, '') + ';';
      }

      $scope.goUrl('/recipe/search?q=' + encodeURIComponent(resultString));
    };

    $scope.activate();
    //#region Internal Methods        

    //#endregion
  }

})(angular);