var fs = require('fs');

var mmm = require('mmmagic'),
    Magic = mmm.Magic;
var ValidFilename = require('valid-filename');

var mongoose = require('mongoose');
var mongooseHandler = require('../server/mongoose-handler');

var model = require('../server/model');
var Image = model.Image;
var Template = model.Template;

var argv = require('minimist')(process.argv.slice(2));
console.dir(argv);

mongooseHandler.init(function callback () {
  var imageFileName = argv.imageFile;
  var templateName = argv.template;
  if (!imageFileName || !templateName) {
    throw "OOPS";
  }

  if (!ValidFilename(templateName)) {
    throw "OOPS";
    return;
  }

  var magic = new Magic(mmm.MAGIC_MIME_TYPE);
  magic.detectFile(imageFileName, function(err, mime) {
    if (err) throw err;
    console.log(mime);

    // Start by saving the image
    var image = new Image({
      data: fs.readFileSync(imageFileName),
      mime: mime
    });

    image.save(function (err, innerImage) {
      if (err) {
        throw err;
      }

      var template = new Template({
        creatorId:null,
        name:templateName,
        imageId:innerImage._id
      });

      template.save(function (err, innerTemplate) {
        if (err) {
          throw err;
        }
        console.log("Template created");
        mongooseHandler.disconnect();
      });
    });

  });
});
