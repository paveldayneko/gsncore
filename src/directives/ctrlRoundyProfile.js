(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlRoundyProfile';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnRoundyProfile', 'gsnProfile', '$modal', '$location', '$rootScope', '$window', '$timeout', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnStore, gsnRoundyProfile, gsnProfile, $modal, $location, $rootScope, $window, $timeout) {
    $scope.isLoading = false;
    $scope.activate = activate;
    $scope.updateProfile = updateProfile;
    $scope.saveProfile = saveProfile;
    $scope.changePhoneNumber = changePhoneNumber;
    $scope.goChangeCardScreen = goChangeCardScreen;
    $scope.profile = null;
    $scope.validateErrorMessage = null;
    $scope.modalInstance = null;
    $scope.ignoreChanges = false;
    $scope.goOutPromt = goOutPromt;
    $scope.$parent.$parent.$parent.goOutPromt = $scope.goOutPromt;

    function activate() {
      if (!$scope.isLoggedIn) return;
      $scope.isLoading = true;
      gsnRoundyProfile.getProfile(true).then(function (rsp) {
        if (!rsp.success)
          $location.url('/maintenance');

        $scope.isLoading = false;
        $scope.updateProfile();
      });
      gsnStore.getStores().then(function (rsp) {
        $scope.stores = rsp.response;
      });

      gsnStore.getStates().then(function (rsp) {
        $scope.states = rsp.response;
      });
    }

    $scope.$on("$locationChangeStart", function (event, next, current) {
      if ($scope.ignoreChanges) return;
      $scope.goOutPromt(event, next, goNext, false);
    });

    $scope.$on("$locationChangeSuccess", function () {
      if ($scope.modalInstance)
        $scope.modalInstance.close();
    });

    $scope.$watch("profile.PostalCode", function (newValue) {
      if (newValue) {
        var pat = /^[0-9]{5}(?:[0-9]{4})?$/;
        $scope.MyForm.zipcode.$setValidity('', pat.test(newValue));
      } else if ($scope.MyForm.zipcode) {
        $scope.MyForm.zipcode.$setValidity('', true);
      }
    });

    //$scope.$on("gsnevent:roundy-error", function () {
    //  $scope.isLoading = false;
    //  $location.url('/maintenance');
    //});

    $scope.$on('$destroy', function () { $scope.$parent.$parent.$parent.goOutPromt = null; });

    $scope.activate();

    //#region Internal Methods  

    function goOutPromt(event, next, callBack, forceAction) {
      if ($scope.MyForm.$dirty) {
        if (event)
          event.preventDefault();
        $scope.ignoreChanges = $window.confirm("All unsaved changes will be lost. Continue?");
        if ($scope.ignoreChanges) {
          callBack(next);
        }
      } else if (forceAction) {
        callBack(next);
      }
    }

    function goNext(next) {
      $timeout(function () {
        $location.url(next.replace(/^(?:\/\/|[^\/]+)*\//, ""));
      }, 5);
    }

    function updateProfile() {
      $scope.profile = gsnRoundyProfile.profile;
      gsnProfile.getProfile().then(function (rst) {
        if (rst.success) {
          var profile = rst.response;
          if ($scope.profile.FirstName)
            profile.FirstName = $scope.profile.FirstName;
          if ($scope.profile.LastName)
            profile.LastName = $scope.profile.LastName;
          profile.PrimaryStoreId = $scope.profile.PrimaryStoreId;
          $rootScope.$broadcast('gsnevent:profile-load-success', { success: true, response: profile });
        }
      });
    }

    function saveProfile() {
      $scope.validateErrorMessage = null;
      $scope.isLoading = true;
      var payload = angular.copy($scope.profile);

      gsnRoundyProfile.saveProfile(payload).then(function (rsp) {
        $scope.isLoading = false;
        $scope.MyForm.$dirty = false;
        if (rsp.response && rsp.response.ExceptionMessage == "Profile Id is required.")
          $location.url('/maintenance');
        else if (rsp.response && rsp.response.ExceptionMessage)
          $scope.validateErrorMessage = rsp.response.ExceptionMessage;
        else if (rsp.response && rsp.response.Message)
          $scope.validateErrorMessage = rsp.response.Message;
        else {
          $scope.updateProfile();
          $scope.updateSuccessful = true;
        }
      });
    }

    function changePhoneNumber() {
      $scope.modalInstance = $modal.open({
        templateUrl: gsn.getThemeUrl('/views/roundy-profile-phonenumber.html'),
        controller: 'ctrlRoundyProfileChangePhoneNumber',
        resolve: {
          gsnRoundyProfile: function () {
            return gsnRoundyProfile;
          }
        }
      });

      $scope.modalInstance.result.then(function () {
        $scope.updateProfile();
      }, function () {
        console.log('Cancelled');
      })['finally'](function () {
        $scope.modalInstance = undefined;
      });
    }

    function goChangeCardScreen(isECard) {

      $scope.isLoading = true;
      $scope.validateErrorMessage = null;
      var payload = angular.copy($scope.profile);

      gsnRoundyProfile.saveProfile(payload).then(function (rsp) {
        $scope.isLoading = false;
        $scope.MyForm.$dirty = false;
        if (rsp.response && rsp.response.ExceptionMessage == "Profile Id is required.")
          $location.url('/maintenance');
        else if (rsp.response && rsp.response.ExceptionMessage)
          $scope.validateErrorMessage = rsp.response.ExceptionMessage;
        else if (rsp.response && rsp.response.Message)
          $scope.validateErrorMessage = rsp.response.Message;
        else {
          $scope.updateProfile();
          openChangeCardScreen(isECard);
        }
      });

    }


    function openChangeCardScreen(isECard) {
      var url = isECard ? '/views/e-fresh-perks-registration.html' : '/views/fresh-perks-registration.html';

      $scope.modalInstance = $scope.modalInstance = $modal.open({
        templateUrl: gsn.getThemeUrl(url),
        controller: 'ctrlFreshPerksCardRegistration',
      });

      $scope.modalInstance.result.then(function () {
        $scope.updateProfile();
      }, function () {
        console.log('Cancelled');
      })['finally'](function () {
        $scope.modalInstance = undefined;
      });
    }

    //#endregion
  }

  angular.module('gsn.core').controller('ctrlRoundyProfileChangePhoneNumber', ['$scope', '$modalInstance', 'gsnRoundyProfile', function ($scope, $modalInstance, gsnRoundyProfile) {
    $scope.input = {};
    $scope.input.PhoneNumber = gsnRoundyProfile.profile.Phone;
    $scope.isECard = gsnRoundyProfile.profile.IsECard;

    if ($scope.input.PhoneNumber && $scope.input.PhoneNumber.length != 10)
    {
      $scope.validateErrorMessage = 'Phone number must be 10 digits long';
    }
    $scope.remove = function () {
      //removing
      $scope.isLoading = true;
      gsnRoundyProfile.removePhone().then(function () {
        $scope.isLoading = false;
        $modalInstance.close();
      });
    };

    $scope.save = function () {
      $scope.isLoading = true;    
      gsnRoundyProfile.savePhonNumber($scope.input.PhoneNumber).then(function (rsp) {
        $scope.isLoading = false;
        if (rsp.response.Success) {
          gsnRoundyProfile.profile.Phone = $scope.input.PhoneNumber;
          $modalInstance.close();
        } else {
          $scope.validateErrorMessage = rsp.response.Message;
          $scope.input.PhoneNumber = gsnRoundyProfile.profile.Phone;
        }
     
      });
    };

    $scope.cancel = function() {
      $modalInstance.close();
    };
  }]);

  angular.module('gsn.core').controller('ctrlNotificationWithTimeout', ['$scope', '$modalInstance', '$timeout', 'message', 'background', function ($scope, $modalInstance, $timeout, message, background) {
    $scope.message = message;
    $scope.style = {
      'background-color': background,
      'color': '#ffffff',
      'text-align': 'center',
      'font-size': 'x-large',
    };
    $timeout(function () {
      $modalInstance.dismiss('cancel');
    }, 1000);
  }]);

})(angular);
