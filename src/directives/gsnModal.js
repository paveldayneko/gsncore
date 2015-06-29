(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnModal', ['$compile', '$timeout', '$location', '$http', '$templateCache', '$rootScope', 'gsnApi', function($compile, $timeout, $location, $http, $templateCache, $rootScope, gsnApi) {

    /***
     * simple directive
     * @type {Object}
     */
    var directive = {
      link: link,
      scope: true,
      restrict: 'AE'
    };
    return directive;

    function link(scope, element, attrs) {
      var myHtml, templateLoader, tplURL;
      tplURL = scope.$eval(attrs.gsnModal);
      scope.$location = $location;
      myHtml = '';
      templateLoader = $http.get(tplURL, {
        cache: $templateCache
      }).success(function(html) {
        return myHtml = '<div class="myModalForm modal" style="display: block"><div class="modal-dialog">' + html + '</div></div>"';
      });
      scope.closeModal = function() {
        return gmodal.hide();
      };
      scope.openModal = function(e) {
        if (e != null) {
          if (e.preventDefault != null) {
            e.preventDefault();
          }
        }
        var forceShow = false;
        if (attrs.forceShow) {
          forceShow = true;
        }

        if (!gmodal.isVisible || forceShow) {
          if (attrs.item) {
            scope.item = scope.$eval(attrs.item);
          } 
          templateLoader.then(function() {
            var $modalElement = angular.element($compile(myHtml)(scope));
            return gmodal.show({
              content: $modalElement[0],
              hideOn: attrs.hideOn || 'click,esc,tap',
              cls: attrs.cls,
              timeout: attrs.timeout,
              closeCls: attrs.closeCls || 'close modal',
              disableScrollTop: attrs.disableScrollTop
            }, scope.$eval(attrs.hideCb));
          }); 
        }
        return scope;
      };
      scope.hideModal = scope.closeModal;
      scope.showModal = scope.openModal;

      scope.goUrl = function (url, target) {
        if (gsnApi.isNull(target, '') == '_blank') {
          $window.open(url, '');
          return;
        }

        $location.url(url);
        scope.closeModal();
      };

      if (attrs.showIf) {
        scope.$watch(attrs.showIf, function(newValue) {
          if (newValue > 0) {
            $timeout(scope.openModal, 550);
          }
        });
      }

      if (attrs.show) {
        scope.$watch(attrs.show, function (newValue) {
          if (newValue) {
            $timeout(scope.openModal, 550);
          } else {
            $timeout(scope.closeModal, 550);
          }
        });
      }
			
	  if (attrs.eventToClose) {
        scope.$on(attrs.eventToClose, function() {
		  scope.closeModal();
		});
      }
    };
  }]);
})(angular);