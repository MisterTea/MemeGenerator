var fs = require('fs');

var express = require('express');
var Hierarchy = require('../server/hierarchy');
var AuthHelper = require('../server/auth-helper');
var _ = require('lodash');
var options = require('../server/options-handler').options;

var SearchHandler = require('../server/search-handler');
var log = require('../server/logger').log;

var model = require('../server/model');
var Meme = model.Meme;
var User = model.User;
var Group = model.Group;
var Image = model.Image;
var FileData = model.FileData;
var AngularError = model.AngularError;

var router = express.Router();

RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

router.post(
  '/me',
  function(req, res) {
    if (req.isAuthenticated()) {
      res.status(200).type('application/json').send(req.user);
    } else {
      res.status(200).type('application/json').send(null);
    }
  }
);

router.post(
  '/updateMe',
  function(req, res) {
    if (!req.isAuthenticated()) {
      log.warn("Tried to update user but not authenticated");
      res.status(403).end();
      return;
    }

    var newUser = req.body;
    if (newUser._id != req.user._id.toString()) {
      log.warn({message:"Tried to update user but wrong user id",requestedUser:newUser,actualId:req.user._id});
      res.status(403).end();
      return;
    }
    User.findByIdAndUpdate(
      newUser._id,
      newUser,
      function(err, dummyUser) {
        if (err) {
          log.error({error:err});
          res.status(500).end();
        }
        res.status(200).end();
      });
  }
);

router.post(
  '/createMeme',
  function(req, res) {
    if (!req.isAuthenticated()) {
      res.status(403).end();
      return;
    }

    // sanitize
    var rawMeme = req.body;
    rawMeme._id = null;
    rawMeme.creatorId = req.user._id;
    rawMeme.votes = [req.user._id];

    var meme = new Meme(rawMeme);
    log.debug({text:"CREATING MEME:", meme:meme});

    meme.save(function(err, innerMeme) {
      if (err) {
        log.error(err);
        res.status(500).end();
      } else {
        res.status(200).type("application/json").send(JSON.stringify(innerMeme));
      }
    });
  }
);

router.post(
  '/getMeme/:id',
  function(req, res) {
    var id = req.param('id');

    Meme.findById(
      id,
      function(err, meme) {
        if (!meme) {
          log.warn({message:"TRIED TO GET UNKNOWN MEME",user:req.user,id:id});
          res.status(404).end();
          return;
        }

        res.status(200).type("application/json").send(JSON.stringify(meme));
      });
  }
);

router.post(
  '/updateMeme/:id',
  function(req, res) {
    if (!req.isAuthenticated()) {
      res.status(403).end();
      return;
    }

    var id = req.param('id');
    log.debug({text:"UPDATING MEME", id:id});

    // sanitize
    var rawMeme = req.body;
    delete rawMeme._id;
    delete rawMeme.creatorId;
    delete rawMeme.chatlog;
    delete rawMeme.votes;
    delete rawMeme.creationTime;

    Meme.findById(
      id,
      function(err, meme) {
        if (!meme) {
          log.warn({message:"TRIED TO UPDATE UNKNOWN MEME",user:req.user,id:id});
          res.status(404).end();
          return;
        }

        if (meme.creatorId !== req.user._id) {
          log.warn({message:"TRIED TO UPDATE MEME WITHOUT ACCESS",user:req.user,meme:meme});
          res.status(403).end();
          return;
        }

        meme = _.extend(meme, rawMeme);

        meme.save(function(err, innerMeme) {
          if (err) {
            log.error({message:"Error updating meme",error:err});
            res.status(500).end();
            return;
          }
          res.status(200).type("application/json").send(JSON.stringify(innerMeme));
        });
      });
  }
);

router.post(
  '/deleteMeme/:id',
  function(req, res) {
    if (!req.isAuthenticated()) {
      res.status(403).end();
      return;
    }

    var id = req.param('id');
    log.debug({text:"DELETING MEME", id:id});

    Meme.findById(
      id,
      function(err, meme) {
        if (!meme) {
          log.warn({message:"TRIED TO DELETE UNKNOWN MEME",user:req.user,id:id});
          res.status(404).end();
          return;
        }

        if (meme.creatorId !== req.user._id) {
          log.warn({message:"TRIED TO DELETE MEME WITHOUT ACCESS",user:req.user,meme:meme});
          res.status(403).end();
          return;
        }

        meme.remove(function(err) {
          if (err) {
            log.error({message:"Error deleting meme",error:err});
            res.status(500).end();
            return;
          }
          res.status(200).end();
        });
      });
  }
);

router.post(
  '/addChat/:memeId',
  function(req, res) {
    if (!req.isAuthenticated()) {
      res.status(403).end();
      return;
    }

    var memeId = req.param('memeId');

    var chat = {
      creatorId:req.user._id,
      content:req.body
    };

    Meme.findById(
      memeId,
      function(err, meme) {
        if (!meme) {
          log.warn({message:"TRIED TO GET UNKNOWN MEME",user:req.user,id:memeId});
          res.status(404).end();
          return;
        }

        meme.chatlog.push(chat);

        meme.save(function(err, innerMeme) {
          res.status(200).type("application/json").send(JSON.stringify(innerMeme));
        });
      });
  }
);

router.post(
  '/findUserFullName/:fullName',
  function(req, res) {
    var fullName = req.param('fullName');
    User
      .find({fullName:new RegExp("^"+RegExp.escape(fullName), "i")})
      //.where('lastLoginTime').ne(null)
      .limit(5)
      .sort('fullName')
      .exec(function(err, users) {
        if (err) {
          log.error(err);
          res.status(500).end();
          return;
        }

        log.debug({results:users});
        res.status(200).type("application/json").send(JSON.stringify(users));
      });
  }
);

router.post(
  '/getUserByEmail/:email',
  function(req, res) {
    User
      .findOne({email:req.param('email')})
      .exec(function(err, user) {
        if (err) {
          log.error(err);
          res.status(500).end();
          return;
        }

        if (user) {
          res.status(200).type("application/json").send(JSON.stringify(user));
        } else {
          res.status(200).type("application/json").send(JSON.stringify(null));
        }
      });
  }
);

router.post(
  '/findGroupName/:name',
  function(req, res) {
    var name = req.param('name');
    Group
      .find({name:new RegExp("^"+RegExp.escape(name), "i")})
      .limit(5)
      .sort('name')
      .exec(function(err, groups) {
        if (err) {
          log.error(err);
          res.status(500).end();
          return;
        }

        log.debug({results:groups});
        res.status(200).type("application/json").send(JSON.stringify(groups));
      });
  }
);

var chance = new require('chance')();

router.post(
  '/saveImage',
  AuthHelper.ensureAuthenticated,
  function(req,res) {
    console.log("SAVING IMAGE");
    var imageData = req.body;

    var uniqueName =
          chance.string({length: 8, pool:"1234567890abcdef"}) + "_" +
          imageData.name;

    var image = new Image({
      base64:imageData.base64,
      data:new Buffer(imageData.base64, 'base64'),
      mime:imageData.mime,
      name:uniqueName,
      filename:imageData.name});

    if (options.database.saveMediaToDb) {
      image.save(function (err) {
        if (err) {
          res.status(500).end();
          return;
        }
        res.status(200).type("text/plain").send(uniqueName);
      });
    } else {
      fs.writeFile('usermedia/'+uniqueName, JSON.stringify(image), function(err) {
        if (err) {
          res.status(500).end();
          return;
        }
        res.status(200).type("text/plain").send(uniqueName);
      });
    }
  });

router.get(
  '/getImage/:name',
  function(req,res) {
    var name = req.param('name');
    console.log("Getting image with name " + name);

    if (options.database.saveMediaToDb) {
      Image.find({name:name}, function(err,results) {
        if (results.length>1) {
          res.status(500).end();
        } else if(results.length==0) {
          res.status(404).end();
        }
        var image = results[0];
        res.setHeader('Content-disposition', 'attachment; filename='+image.filename);
        res.status(200).type(image.mime).send(image.data);
      });
    } else {
      var path = 'usermedia/'+name;
      fs.exists(path, function(exists) {
        if (!exists) {
          res.status(404).end();
          return;
        }
        fs.readFile(path, function(err, data) {
          if (err) {
            res.status(500).end();
            return;
          }
          var image = JSON.parse(data);
          // Note that image.data didn't survive going to JSON and back.
          res.setHeader('Content-disposition', 'attachment; filename='+image.filename);
          res.status(200).type(image.mime).send(new Buffer(image.base64, 'base64'));
        });
      });
    }
  });

router.post(
  '/saveFile',
  AuthHelper.ensureAuthenticated,
  function(req,res) {
    console.log("SAVING FILE");
    var fileDataJson = req.body;

    var uniqueName =
          chance.string({length: 8, pool:"1234567890abcdef"}) + "_" +
          fileDataJson.name;

    var fileData = new FileData({
      base64:fileDataJson.base64,
      data:new Buffer(fileDataJson.base64, 'base64'),
      mime:fileDataJson.mime,
      name:uniqueName,
      filename:fileDataJson.name});

    if (options.database.saveMediaToDb) {
      fileData.save(function (err) {
        if (err) {
          console.dir(err);
          log.error({error:err});
          res.status(500).end();
        }
        res.status(200).type("text/plain").send(uniqueName);
      });
    } else {
      fs.writeFile('usermedia/'+uniqueName, JSON.stringify(fileData), function(err) {
        if (err) {
          res.status(500).end();
          return;
        }
        res.status(200).type("text/plain").send(uniqueName);
      });
    }
  });

router.get(
  '/getFile/:name',
  function(req,res) {
    var name = req.param('name');
    console.log("Getting file with name " + name);

    if (options.database.saveMediaToDb) {
      FileData.find({name:name}, function(err,results) {
        if (results.length>1) {
          res.status(500).end();
        } else if(results.length==0) {
          res.status(404).end();
        }
        var file = results[0];
        res.setHeader('Content-disposition', 'attachment; filename='+file.filename);
        res.status(200).type(file.mime).send(file.data);
      });
    } else {
      var path = 'usermedia/'+name;
      fs.exists(path, function(exists) {
        if (!exists) {
          res.status(404).end();
          return;
        }
        fs.readFile(path, function(err, data) {
          if (err) {
            res.status(500).end();
            return;
          }
          var fileData = JSON.parse(data);
          // Note that fileData.data didn't survive going to JSON and back.
          res.setHeader('Content-disposition', 'attachment; filename='+fileData.filename);
          res.status(200).type(fileData.mime).send(new Buffer(fileData.base64, 'base64'));
        });
      });
    }

  });

router.post(
  '/angularerror',
  function(req, res) {
    var errorDetails = req.body;
    console.log("ERROR DETAILS");
    console.dir(errorDetails);
    new AngularError(errorDetails).save(function(err) {
      if (err) {
        log.error({error:err});
        res.status(500).end();
      } else {
        res.status(200).end();
      }
    });
  }
);

module.exports = router;
