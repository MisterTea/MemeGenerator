var fs = require('fs');

var express = require('express');
var ValidFilename = require('valid-filename');
var _ = require('lodash');
var Base64 = require('js-base64').Base64;
var async = require('async');

var AuthHelper = require('../server/auth-helper');
var options = require('../server/options-handler').options;

var SearchHandler = require('../server/search-handler');
var log = require('../server/logger').log;

var model = require('../server/model');
var Image = model.Image;
var Meme = model.Meme;
var User = model.User;
var Group = model.Group;
var Template = model.Template;
var AngularError = model.AngularError;

var backend = require('../server/backend');

var ImageHandler = require('../server/image-handler');

var router = express.Router();

RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

router.get(
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
          return;
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
    delete rawMeme._id;
    rawMeme.creatorId = req.user._id;
    rawMeme.votes = [req.user._id];
    rawMeme.numVotes = 1;
    rawMeme.templateId = rawMeme.template._id;
    delete rawMeme.template;

    var meme = new Meme(rawMeme);
    log.debug({text:"CREATING MEME:", meme:meme});

    meme.save(function(err, innerMeme) {
      log.debug({text:"CREATED MEME:", meme:innerMeme});
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
  '/vote/:memeId',
  function(req, res) {
    if (!req.isAuthenticated()) {
      res.status(403).end();
      return;
    }

    var memeId = req.param('memeId');
    var up = req.body.up;
    console.log("VOTING: " + memeId + " " + up);

    Meme.findById(memeId, function(err, meme) {
      var iVote = _.findIndex(meme.votes, function(id) {
        return id.toString() == req.user._id;
      });
      var iDownVote = _.findIndex(meme.downvotes, function(id) {
        return id.toString() == req.user._id;
      });
      console.log(iVote + " / " + iDownVote);
      if (iVote > -1) {
        // voted
        if (iDownVote > -1) {
          // downvoted

          // should never happen
          meme.downvotes.splice(iDownVote,1);
        } else {
          if (up) {
            // Redundant
          } else {
            // Remove vote
            console.log("REMOVING VOTE " + iVote);
            console.dir(meme.votes);
            meme.votes.splice(iVote,1);
            console.dir(meme.votes);
          }
        }
      } else {
        // didn't vote
        if (iDownVote > -1) {
          // downvoted
          if (up) {
            // remove downvote
            meme.downvotes.splice(iDownVote,1);
          } else {
            // Redundant
          }
        } else {
          // didn't downvote
          if (up) {
            meme.votes.push(req.user._id);
          } else {
            meme.downvotes.push(req.user._id);
          }
        }
      }

      meme.numVotes = meme.votes.length - meme.downvotes.length;
      console.dir(meme);
      meme.save(function(err, innerMeme) {
        if (err) {
          log.error(err);
          res.status(500).end();
        } else {
          res.status(200).type("application/json").send(JSON.stringify(innerMeme));
        }
      });
    });
  }
);

router.get(
  '/recent/:offset/:size',
  function(req, res) {
    var offset = req.param('offset');
    var size = req.param('size');

    Meme
      .find({})
      .sort('-creationTime')
      .skip(offset)
      .limit(size)
      .exec(function(err, memes) {
        if (err) {
          res.status(500).end();
          return;
        }

        res.status(200).type("application/json").send(JSON.stringify(memes));
      });
  }
);

router.get(
  '/top/:dateRange/:offset/:size',
  function(req, res) {
    var dateRange = req.param('dateRange');
    var offset = req.param('offset');
    var size = req.param('size');

    var query = Meme.find({});
    if (dateRange == 'weekly') {
      // 604800000 == milliseconds per week
      query.where('creationTime').gt(Date.now() - 604800000);
    }
    query.sort('-numVotes')
      .skip(offset)
      .limit(size)
      .exec(function(err, memes) {
        if (err) {
          res.status(500).end();
          return;
        }

        res.status(200).type("application/json").send(JSON.stringify(memes));
      });
  }
);

router.get(
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
      content:req.body.chat
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

router.get(
  '/getUser/:id',
  function(req, res) {
    var id = req.param('id');

    User.findById(
      id,
      function(err, user) {
        if (!user) {
          log.warn({message:"TRIED TO GET UNKNOWN USER",user:req.user,id:id});
          res.status(404).end();
          return;
        }

        res.status(200).type("application/json").send(JSON.stringify(user));
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
  '/createTemplate',
  AuthHelper.ensureAuthenticated,
  function(req,res) {
    console.log("SAVING TEMPLATE");
    var rawTemplate = req.body;

    // Sanitize
    if (!ValidFilename(rawTemplate.name)) {
      res.status(500).end();
      return;
    }

    if (!rawTemplate.name ||
        rawTemplate.name.length == 0 ||
        !rawTemplate.base64 ||
        !rawTemplate.mime) {
      res.status(500).end();
      return;
    }

    var data = new Buffer(rawTemplate.base64, 'base64');
    var mime = rawTemplate.mime;

    backend.createTemplate(
      rawTemplate.name,
      data,
      mime,
      req.user._id,
      function(err, template) {
      if (err) {
        res.status(500).end();
        return;
      }
      res.status(200).type("application/json").send(JSON.stringify(template));
    });

  });


var addTemplateMetadata = function(template, callback) {
  Image.findById(template.imageId).select('mime').exec(function(err,image) {
    if (!image) {
      callback(null, template);
    }

    template.animated = (image.mime == 'image/gif');
    console.log("SETTING TEMPLATE ANIMATED: " + template.animated);
    console.dir(template);
    callback(null, template);
  });
};

router.get(
  '/getAllTemplates',
  function(req,res) {
    Template.find({}).lean().exec(function(err,templates) {
      async.map(templates, addTemplateMetadata, function(err, innerTemplates) {
        console.dir(innerTemplates);
        res.status(200).type("application/json").send(JSON.stringify(innerTemplates));
      });
    });
  });

router.get(
  '/getTemplate/:id',
  function(req,res) {
    var id = req.param('id');
    console.log("Getting template with id " + id);

    Template.findById(id).lean().exec(function(err,template) {
      addTemplateMetadata(template, function(err, innerTemplate) {
        res.status(200).type("application/json").send(JSON.stringify(innerTemplate));
      });
    });
  });

router.get(
  '/getTemplateAllFrames/:id',
  function(req,res) {
    var id = req.param('id');
    var messages = JSON.parse(Base64.decode(req.query.messages));
    console.dir(messages);

    Template.findById(id, function(err, template) {
      if (!template) {
        console.log("COULD NOT FIND TEMPLATE: " + id);
        res.status(404).end();
        return;
      }

      Image.findById(template.imageId, function(err,image) {
        if (!image) {
          res.status(500).end();
          return;
        }

        var mime = image.mime;
        var data = image.data;
        var extension = mime.split('/')[1];

        if (messages) {
          ImageHandler.annotate(data, extension, messages, function(annotatedImage) {
            data = annotatedImage;
            var filename = template.name + '.' + extension;
            res.setHeader('Content-disposition', 'attachment; filename='+filename);
            res.status(200).type(mime).send(data);
          });
        } else {
          var filename = template.name + '.' + extension;
          res.setHeader('Content-disposition', 'attachment; filename='+filename);
          res.status(200).type(mime).send(data);
        }
      });
    });
  });

router.get(
  '/getTemplateFirstFrame/:id',
  function(req,res) {
    var id = req.param('id');
    var messages = JSON.parse(Base64.decode(req.query.messages));

    Template.findById(id, function(err, template) {
      if (!template) {
        console.log("COULD NOT FIND TEMPLATE: " + id);
        res.status(404).end();
        return;
      }

      Image.findById(template.imageId, function(err,image) {
        if (!image) {
          res.status(500).end();
          return;
        }

        var mime = image.mime;
        var data = image.data;

        var uploadImage = function() {
          var extension = mime.split('/')[1];
          var filename = template.name + '.' + extension;
          res.setHeader('Content-disposition', 'attachment; filename='+filename);
          ImageHandler.annotate(data, extension, messages, function(annotatedImage) {
            data = annotatedImage;
            var filename = template.name + '.' + extension;
            res.setHeader('Content-disposition', 'attachment; filename='+filename);
            res.status(200).type(mime).send(data);
          });
        };

        if (mime == 'image/gif') {
          mime = 'image/png';
          data = image.firstFrameData;
          if (data) {
            uploadImage();
          } else {
            // Compute the first frame
            log.info("Computing the first frame of a gif");
            ImageHandler.getFirstFrameOfGif(image.data, function(firstFrameData) {
              if (!firstFrameData) {
                res.status(500).end();
                return;
              }
              image.firstFrameData = firstFrameData;
              data = firstFrameData;
              image.save(function(err, innerImage) {
                if (err) {
                  res.status(500).end();
                  return;
                }
                uploadImage();
              });
            });
          }
        } else {
          res.status(204).end();
          return;
        }
      });
    });
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
