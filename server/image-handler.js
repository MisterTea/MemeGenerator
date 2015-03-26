var _ = require('lodash');
var gm = require('gm');
gm = gm.subClass({ imageMagick: true });

var log = require('./logger').log;

exports.getFirstFrameOfGif = function(imageBuffer, callback) {
  gm(imageBuffer, 'image.gif[0]')
    .toBuffer('PNG', function(err, buffer) {
      if (err) {
        log.error("Could not extract first frame from gif");
        callback(null);
        return;
      }

      callback(buffer);
    });
};
