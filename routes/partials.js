var express = require('express');
var AuthHelper = require('../server/auth-helper');
var options = require('../server/options-handler').options;
var log = require('../server/logger').log;

var router = express.Router();

var model = require('../server/model');
var Page = model.Page;
var PageVersion = model.PageVersion;
var User = model.User;
var Group = model.Group;
var Image = model.Image;

router.get(
  '/creatememe.html',
  function(req, res) {
    res.render('partials/creatememe', {
      server:{
        projectName:options.serverName
      }
    });
  }
);

router.get(
  '/gallery.html',
  function(req, res) {
    res.render('partials/gallery', {
      server:{
        projectName:options.serverName
      }
    });
  }
);

router.get(
  '/meme.html',
  function(req, res) {
    res.render('partials/meme', {
      server:{
        projectName:options.serverName
      }
    });
  }
);

module.exports = router;
