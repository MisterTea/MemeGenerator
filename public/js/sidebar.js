app.controller('SideBarController', ['$scope', '$location', '$timeout', '$rootScope', '$log', 'retryHttp', function($scope, $location, $timeout, $rootScope, $log, retryHttp) {
  var updateNav = function() {
    var path = $location.path();
    console.log("PATH: " + $location.path());
    $scope.onCreate = (path == '/creatememe');
    $scope.onRecent = (path == '/recent');
    $scope.onTopWeekly = (path == '/top/weekly');
    $scope.onTopAllTime = (path == '/top/alltime');
    console.log($scope.onRecent);
  };

  $scope.$watch(function(){ return $location.path(); }, function() {
    updateNav();
  });
  updateNav();
}]);
