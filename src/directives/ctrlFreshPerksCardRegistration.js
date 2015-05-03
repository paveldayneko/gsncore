(function (angular, undefined) {
  'use strict';

  angular.module('gsn.core').controller('ctrlFreshPerksCardRegistration', ['$scope', '$modalInstance', 'gsnRoundyProfile', '$timeout', 'gsnApi', '$location', 'gsnStore', function ($scope, $modalInstance, gsnRoundyProfile, $timeout, gsnApi, $location, gsnStore) {
    $scope.profile = null;
    $scope.foundProfile = null;
    $scope.input = {};
    $scope.newCardForm = {};
    $scope.setNewCardFormScope = setNewCardFormScope;
    $scope.input.updateProfile = false;
    $scope.activate = activate;
    $scope.validateCardNumber = validateCardNumber;
    $scope.showMismatchErrorMessage = false;
    $scope.goAddCardScreen = goAddCardScreen;
    $scope.goNewCardScreen = goNewCardScreen;
    $scope.goFoundCardScreen = goFoundCardScreen;
    $scope.mergeAccounts = mergeAccounts;
    $scope.registerLoyaltyCard = registerLoyaltyCard;
    $scope.registerELoyaltyCard = registerELoyaltyCard;
    $scope.removeLoyaltyCard = removeLoyaltyCard;
    $scope.close = close;
    $scope.currentView = gsnApi.getThemeUrl('/views/fresh-perks-registration-add.html');
    $scope.validateErrorMessage = null;

    function activate() {
      /*
      $scope.isLoading = true;
      gsnRoundyProfile.getProfile().then(function () {
        $scope.isLoading = false;
        $scope.profile = gsnRoundyProfile.profile;
      });
      */
      $scope.foundProfile = angular.copy(gsnRoundyProfile.profile);
      gsnStore.getStores().then(function (rsp) {
        $scope.stores = rsp.response;
      });

      gsnStore.getStates().then(function (rsp) {
        $scope.states = rsp.response;
      });

      $scope.$watch("foundProfile.PostalCode", function (newValue) {
        if ($scope.newCardForm.MyForm) {
          if (newValue) {
            var pat = /^[0-9]{5}(?:[0-9]{4})?$/;
            $scope.newCardForm.MyForm.zipcode.$setValidity('', pat.test(newValue));
          } else {
            $scope.newCardForm.MyForm.zipcode.$setValidity('', true);
          }
        }
      });

    }

    function validateCardNumber() {
      $scope.isLoading = true;
      gsnRoundyProfile.validateLoyaltyCard($scope.foundProfile.FreshPerksCard).then(function (result) {
        if (result.response.Success) {
          // Possible values are: ExactMatch, SameCustomer, Unregistered, Mismatch
          switch (result.response.Response.ValidationResult) {
            case "SameCustomer":
              //Found
              $scope.foundProfile = result.response.Response.Profile;
              $scope.foundProfile.FreshPerksCard = $scope.foundProfile.ExternalId;
              $scope.input.updateProfile = true;
              goFoundCardScreen();
              break;
            case "ExactMatch":
              gsnRoundyProfile.associateLoyaltyCardToProfile($scope.foundProfile.FreshPerksCard).then(function (rslt) {
                //TODO: check errors 
                gsnRoundyProfile.profile.FreshPerksCard = $scope.foundProfile.FreshPerksCard;
                gsnRoundyProfile.profile.IsECard = false;
                close();
              });
              break;
            case "Unregistered":
              $scope.foundProfile = angular.copy(gsnRoundyProfile.profile);
              $scope.foundProfile.ExternalId = result.response.Response.Profile.ExternalId;
              $scope.foundProfile.FreshPerksCard = result.response.Response.Profile.ExternalId;
              goNewCardScreen();
              break;
            case "Mismatch":
              //Error
              $scope.isLoading = false;
              $scope.showMismatchErrorMessage = true;
              break;
            default:
              $scope.isLoading = false;
              $scope.validateErrorMessage = result.response.Message;
          }
        } else if (result.response && result.response.Message) {
          $scope.isLoading = false;
          $scope.validateErrorMessage = result.response.Message;
        }
      });
    }

    function removeLoyaltyCard() {
      $scope.isLoading = true;
      gsnRoundyProfile.removeLoyaltyCard().then(function (result) {
        if (!result.response.Success) {
          $scope.isLoading = false;
          $scope.validateErrorMessage = 'Loyalty Card can not be removed now';
        } else {
          gsnRoundyProfile.profile.FreshPerksCard = null;
          $scope.isLoading = false;
          $scope.close();
        }
      });
    }

    function mergeAccounts() {
      $scope.isLoading = true;
      gsnRoundyProfile.mergeAccounts($scope.foundProfile.ExternalId, $scope.input.updateProfile).then(function (result) {
        if (!result.response.Success) {
          $scope.isLoading = false;
          $scope.validateErrorMessage = result.response.Message;
        } else {
          gsnRoundyProfile.profile = gsnRoundyProfile.getProfile(true).then(function () {
            $scope.isLoading = false;
            $scope.close();
          });
        }
      });
    }

    function registerLoyaltyCard() {
      $scope.isLoading = true;
      gsnRoundyProfile.registerLoyaltyCard($scope.foundProfile).then(function (result) {
        $scope.isLoading = false;
        if (!result.response.Success) {
          $scope.validateErrorMessage = result.response.Message;
        } else {
          gsnRoundyProfile.profile = $scope.foundProfile;
          gsnRoundyProfile.profile.IsECard = false;
          close();
        }
      });
    }

    function registerELoyaltyCard() {
      $scope.isLoading = true;
      gsnRoundyProfile.registerELoyaltyCard($scope.foundProfile).then(function (result) {
        $scope.isLoading = false;
        if (!result.response.Success) {
          $scope.validateErrorMessage = result.response.Message;
        } else {
          gsnRoundyProfile.profile = $scope.foundProfile;
          gsnRoundyProfile.profile.IsECard = true;
          gsnRoundyProfile.profile.FreshPerksCard = result.response.Response.LoyaltyECardNumber;
          close();
        }
      });
    }

    function setNewCardFormScope(scope) {
      $scope.newCardForm = scope;
    }

    $scope.activate();

    //#region Internal Methods  


    function goAddCardScreen() {
      resetBeforeRedirect();
      $scope.currentView = gsnApi.getThemeUrl('/views/fresh-perks-registration-add.html');
    }

    function goNewCardScreen() {
      resetBeforeRedirect();
      $scope.currentView = gsnApi.getThemeUrl('/views/fresh-perks-registration-new.html');
    }

    function goFoundCardScreen() {
      resetBeforeRedirect();
      $scope.currentView = gsnApi.getThemeUrl('/views/fresh-perks-registration-found.html');
    }

    function resetBeforeRedirect() {
      $scope.isLoading = false;
      $scope.validateErrorMessage = null;
      $scope.showMismatchErrorMessage = false;
    }

    function close() {
      resetBeforeRedirect();
      $timeout(function () {
        $modalInstance.close();
        //$location.url('/myaccount');
      }, 500);

    }

    //#endregion
  }]);
})(angular);