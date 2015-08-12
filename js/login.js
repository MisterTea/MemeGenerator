var app = require('./app').app;
var $ = require('jquery');

app.controller('LoginController', ['$scope', '$http', '$timeout', '$location', function($scope, $http, $timeout, $location) {
  if (window.location.hash) {
    $("#login-form").attr("action", "/login?redirect=" + encodeURIComponent("/view/"+window.location.hash));
  } else {
    $("#login-form").attr("action", "/login?redirect=" + encodeURIComponent("/view/"));
  }
}]);
