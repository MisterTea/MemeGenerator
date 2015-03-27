app = angular.module('MemeGenerator', [
  'angularBootstrapNavTree', 'ngErrorShipper', 'ui.bootstrap', 'ngRoute', 'luegg.directives', 'ui.select']);

app.config(function($routeProvider, $locationProvider) {
  $routeProvider.
    when('/yours', {
      templateUrl: 'partials/gallery.html',
      controller: 'MainGalleryController'
    }).
    when('/recent', {
      templateUrl: 'partials/gallery.html',
      controller: 'MainGalleryController'
    }).
    when('/top/:range', {
      templateUrl: 'partials/gallery.html',
      controller: 'MainGalleryController'
    }).
    when('/meme/:memeId', {
      templateUrl: 'partials/meme.html',
      controller: 'MainMemeController'
    }).
    when('/creatememe', {
      templateUrl: 'partials/creatememe.html',
      controller: 'CreateMemeController'
    }).
    otherwise({
      redirectTo: '/top/weekly'
    });
});
