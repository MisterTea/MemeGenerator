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

exports.annotate = function(imageBuffer, extension, messages, callback) {
  var sizeContent = function(width,height,content) {
    if (!content) {
      content = '';
    }
    var tokens = content.split(/\n+/);
    console.dir(tokens);
    var longestToken = 1;
    for (var a=0;a<tokens.length;a++) {
      longestToken = Math.max(longestToken,tokens[a].length);
    }

    var low = 1;
    var high = Math.max(18,height/5);
    var fontSize = high;
    var numLettersCanFit = Math.floor((width/fontSize)*1.5);
    console.log(numLettersCanFit + " " + longestToken + " " + low + " " + high);
    if (true) {
      // Use bisection to get the right font size
      for (var a=0;a<50;a++) {
        var mid = (low+high)/2;
        console.log(mid);
        fontSize = mid;

        // You can fit 14 M's when (width/fontSize) == 10
        numLettersCanFit = Math.floor((width/fontSize)*1.5);

        if (numLettersCanFit < longestToken) {
          high = mid;
        } else {
          low = mid;
        }
      }
      fontSize = low;
      numLettersCanFit = Math.floor((width/fontSize)*1.5);
    }
    console.log(numLettersCanFit + " " + longestToken + " " + low + " " + high);
    console.log(fontSize);
    fontSize /= Math.max(1.0, tokens.length / 2.0 );

    return {text:content, fontSize:fontSize};
  };

  var drawContent = function(handler, content, width, height, gravity) {
    var finalText = content.text;
    var fontSize = content.fontSize;

    var tokens = finalText.split(/\n+/);

    for (var a=0;a<tokens.length;a++) {
      var drawHeight = 0;
      if (gravity.substring(0,5) == 'South') {
        drawHeight = (tokens.length-1-a)*(fontSize*7/8);
      } else if(gravity.substring(0,5) == 'North') {
        drawHeight = a*fontSize*7/8;
      } else {
        drawHeight = (a - (tokens.length-1)/2.0)*fontSize*7/8;
      }
      var left = 0;
      if (_.endsWith(gravity, "East") || _.endsWith(gravity, "West")) {
        left = 10;
      }
      var border = fontSize/20;

      handler = handler
        .font("./Impact.ttf", fontSize)
        .fill('white')
        .stroke("black", border)
        .drawText(left, drawHeight, tokens[a], gravity);
    }
    return handler;
  };

  var handler = gm(imageBuffer, extension);
  handler
    .size(function(err, value) {
      if (err) {
        console.log("Error: " + err);
        return;
      }
      console.dir(value);

      handler = handler.coalesce();

      for (var a=0;a<messages.length;a++ ){
        var content = sizeContent(
          value.width,value.height,
          messages[a].content);
        var location = null;
        var halign = messages[a].halign;
        var valign = messages[a].valign;
        if (halign == 'left') {
          if (valign == 'top') {
            location = 'NorthWest';
          } else if (valign == 'bottom') {
            location = 'SouthWest';
          } else {
            location = 'West';
          }
        } else if (halign == 'right') {
          if (valign == 'top') {
            location = 'NorthEast';
          } else if (valign == 'bottom') {
            location = 'SouthEast';
          } else {
            location = 'East';
          }
        } else {
          if (valign == 'top') {
            location = 'North';
          } else if (valign == 'bottom') {
            location = 'South';
          } else {
            location = 'Center';
          }
        }

        handler = drawContent(handler, content, value.width, value.height, location);
      }

      handler
        .toBuffer(extension, function(err, buffer) {
          if (err) {
            callback(null);
            return;
          }

          callback(buffer);
        });
    });
};

exports.minSize = function(data, extension, width, height, callback) {
  var handler = gm(data, extension);
  handler
    .size(function(err, value) {
      if (value.width <= width && value.height <= height) {
        // Image is already small enough
        callback(data);
        return;
      }

      handler
        .resize(width, height)
        .toBuffer(extension, function(err, buffer) {
          if (err) {
            callback(null);
            return;
          }

          callback(buffer);
        });
    });
};
