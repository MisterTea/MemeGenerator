var $ = window.$ = window.jQuery = require('jquery');
var jQBridget = require('jquery-bridget');
//TODO: Find out if we need these.
//require('get-style-property');
//require('get-size');
//require('eventemitter');
//require('eventie');
//require('doc-ready');
//require('matches-selector');
require('imagesloaded');
var Masonry = window.Masonry = require('masonry-layout');
// make Masonry a jQuery plugin
//$.bridget( 'masonry', Masonry );

var angular = require('angular');
require('./thirdparty/angular-bootstrap-nav-tree/dist/abn_tree_directive');
require('../public/bower_components/angular-error-shipper');
require('../public/bower_components/angular-bootstrap/ui-bootstrap-tpls');
require('../public/bower_components/angular-route');
require('../public/bower_components/angular-scroll-glue');
require('../public/bower_components/angular-ui-select');
require('angular-masonry');

var app = exports.app = angular.module('MemeGenerator', [
  'angularBootstrapNavTree', 'ngErrorShipper', 'ui.bootstrap', 'ngRoute', 'luegg.directives', 'ui.select', 'wu.masonry']);

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
