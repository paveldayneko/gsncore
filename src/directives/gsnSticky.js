(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive("gsnSticky", ['gsnApi', '$timeout', '$window', function (gsnApi, $timeout, $window) {
    // Usage: make an element sticky 
    // 
    // Creates: 2014-06-13 TomN
    // 
    var directive = {
      restrict: 'EA',
      scope: true,
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      var $win = angular.element($window);
      var myWidth = 0;
      var offsetTop = gsnApi.isNaN(parseInt(attrs.offsetTop), 20);
      var timeout = gsnApi.isNaN(parseInt(attrs.timeout), 2000);

      if (attrs.fixedWidth) {
        if (element.width() > 0) {
          myWidth = element.width();
        }
      }
      
      // make sure UI is completed before taking first snapshot
      $timeout(function () {
        if (scope._stickyElements === undefined) {
          scope._stickyElements = [];

          $win.bind("scroll", function (e) {
            var pos = $win.scrollTop();
            
            angular.forEach(scope._stickyElements, function(item, k) {
              var bottom = gsnApi.isNaN(parseInt(attrs.bottom), 0);
              var top = gsnApi.isNaN(parseInt(attrs.top), 0);
              
              // if screen is too small, don't do sticky
              if ($win.height() < (top + bottom + element.height())) {
                item.isStuck = true;
                pos = -1;
              }

              if (!item.isStuck && pos > (item.start + offsetTop)) {
                item.element.addClass("stuck");
                if (myWidth > 0) {
                  item.element.css({ top: top + 'px', width: myWidth + 'px' });
                } else {
                  item.element.css({ top: top + 'px' });
                }

                item.isStuck = true;
              } else if (item.isStuck && pos <= item.start) {
                item.element.removeClass("stuck");
                item.element.css({ top: null });
                item.isStuck = false;
              }
            });
          });

          var recheckPositions = function () {
            for (var i = 0; i < scope._stickyElements.length; i++) {
              var myItem = scope._stickyElements[i];
              if (!myItem.isStuck) {
                myItem.start = myItem.element.offset().top;
              }
            }
          };

          $win.bind("load", recheckPositions);
          $win.bind("resize", recheckPositions);
        }

        var newItem = {
          element: element,
          isStuck: false,
          start: element.offset().top
        };

        scope._stickyElements.push(newItem);
      }, timeout);

    }
  }]);
})(angular);