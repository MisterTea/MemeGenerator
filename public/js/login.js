app.controller('LoginController', ['$scope', '$http', '$timeout', '$location', function($scope, $http, $timeout, $location) {
  if (location.hash) {
    $("#login-form").attr("action", "/login?redirect=" + encodeURIComponent("/view/"+location.hash));
  } else {
    $("#login-form").attr("action", "/login?redirect=" + encodeURIComponent("/view/"));
  }
}]);
