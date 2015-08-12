var app = require('./app').app;

app.controller('NavbarController', ['$scope', '$rootScope', 'retryHttp', '$modal', '$timeout', 'globalState', 'dataCache', function($scope, $rootScope, retryHttp, $modal, $timeout, globalState, dataCache) {
  dataCache.get('myself', function(myself) {
    $scope.myself = myself;
  });
  $scope.projectName = "Meme Generator";
}]);
