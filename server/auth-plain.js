var log = require('./logger').log;

var model = require('./model');
var Page = model.Page;
var PageVersion = model.PageVersion;
var User = model.User;
var UserPassword = model.UserPassword;

exports.login = function(username,password,successCallback,errorCallback) {
  User.findOne({username:username}, function(err, user) {
    if (err) {
      log.error({error:err});
      errorCallback(err.message);
      return;
    }
    var uid = user._id;
    UserPassword.findOne({userId:uid})
      .exec(function(err, userPassword) {
        if (err) {
          log.error({error:err});
          errorCallback(err.message);
        } else if (!userPassword) {
          errorCallback("No password for user " + uid);
        } else if(userPassword.password != password) {
          errorCallback("Wrong password for user " + uid);
        } else {
          successCallback();
        }
      });
  });
};
