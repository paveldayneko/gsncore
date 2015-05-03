(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnModal', ['$compile', 'gsnApi', '$timeout', '$location', '$window', '$rootScope', function ($compile, gsnApi, $timeout, $location, $window, $rootScope) {
    // Usage: to show a modal
    // 
    // Creates: 2013-12-20 TomN
    // 
    var directive = {
      link: link,
      scope: true,
      restrict: 'AE'
    };

    $rootScope.$on('gsnevent:closemodal', function () {
      angular.element('.myModalForm').modal('hide');
    });

    return directive;

    function link(scope, element, attrs) {
      var modalUrl = scope.$eval(attrs.gsnModal);
      var template = '<div class="myModalForm modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalForm" aria-hidden="true"><div class="modal-dialog" data-ng-include="\'' + modalUrl + '\'"></div></div>';
      var $modalElement = null;

      function closeModal() {
        if ($modalElement) {
          $modalElement.find('iframe').each(function () {
            var src = angular.element(this).attr('src');
            angular.element(this).attr('src', null).attr('src', src);
          });
        }
        var modal = angular.element('.myModalForm').modal('hide');

        if (!attrs.showIf) {
          modal.addClass('myModalFormHidden');
        }
      }

      scope.closeModal = closeModal;

      scope.goUrl = function (url, target) {
        if (gsnApi.isNull(target, '') == '_blank') {
          $window.open(url, '');
          return;
        }

        $location.url(url);
        scope.closeModal();
      };

      scope.showModal = showModal;

      function showModal(e) {
        if (e) {
          e.preventDefault();
        }

        angular.element('.myModalFormHidden').remove();
        if (attrs.item) {
          scope.item = scope.$eval(attrs.item);
        }

        $modalElement = angular.element($compile(template)(scope));
        $modalElement.modal('show');

      }

      if (attrs.showIf) {
        scope.$watch(attrs.showIf, function (newValue) {
          if (newValue > 0) {
            $timeout(showModal, 50);
          }
        });
      }

      if (attrs.show) {
        scope.$watch(attrs.show, function (newValue) {
          if (newValue) {
            $timeout(showModal, 550);
          } else {
            $timeout(closeModal, 550);
          }
        });
      }
    }
  }]);
})(angular);