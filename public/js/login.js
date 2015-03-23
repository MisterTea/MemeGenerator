app.controller('LoginController', ['$scope', '$http', '$timeout', '$location', function($scope, $http, $timeout, $location) {
  if ($location.search()['redirect']) {
    $("#login-form").attr("action", "/login?redirect=" + $location.search()['redirect']);
  } else {
    $("#login-form").attr("action", "/login?redirect=/view");
  }
}]);
