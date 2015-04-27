var model = require('./model');
var Image = model.Image;
var Meme = model.Meme;
var User = model.User;
var Group = model.Group;
var Template = model.Template;
var AngularError = model.AngularError;

var ImageHandler = require('./image-handler');

exports.createTemplate = function(name, data, mime, creatorId, callback) {
  // Resize the image if it is too big
  ImageHandler.minSize(
    data,
    mime.split('/')[1],
    512, 512,
    function(newData) {

      ImageHandler.maxSize(
        newData,
        mime.split('/')[1],
        512, 512,
        function(newData) {

          // Start by saving the image
          var image = new Image({
            data: newData,
            mime: mime
          });

          image.save(function (err, innerImage) {
            if (err) {
              callback(err, null);
              return;
            }

            ImageHandler.getFirstFrameOfGif(image.data, function(firstFrameData) {
              if (!firstFrameData) {
                callback("Could not create first frame", null);
                return;
              }
              image.firstFrameData = firstFrameData;
              data = firstFrameData;
              image.save(function(err, innerImage) {
                if (err) {
                  callback("Could not create first frame", null);
                  return;
                }
                var template = new Template({
                  creatorId:creatorId,
                  name:name,
                  imageId:innerImage._id
                });

                template.save(function (err, innerTemplate) {
                  if (err) {
                    callback(err, null);
                    return;
                  }
                  callback(null, innerTemplate);
                });
              });
            });
          });
        });
    });
};
