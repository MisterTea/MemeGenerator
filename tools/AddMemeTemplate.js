var fs = require('fs');

var mmm = require('mmmagic'),
    Magic = mmm.Magic;
var ValidFilename = require('valid-filename');

var mongoose = require('mongoose');
var mongooseHandler = require('../server/mongoose-handler');
var backend = require('../server/backend');

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

    backend.createTemplate(
      templateName,
      fs.readFileSync(imageFileName),
      mime,
      null,
      function(err, template) {
        console.log("Template created");
        mongooseHandler.disconnect();
      });
  });
});
