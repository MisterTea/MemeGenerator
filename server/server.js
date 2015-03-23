try {
  require('heapdump');
} catch (_error) {}

var fs = require('fs');
var path = require('path');
var https = require('https');
var http = require('http');
var AppHandler = require('./app-handler');

var options = require('./options-handler').options;

var model = require('./model');

var log = require('./logger').log;

require('./mongoose-handler').init(function() {
  log.debug("Connected to MongoDB database");
  var app = AppHandler.init();
  if (options.ssl) {
    log.info("Loading credentials...");
    var certificate  = fs.readFileSync(options.credentials.certificateFile, 'utf8');
    var privateKey = fs.readFileSync(options.credentials.privateKeyFile, 'utf8');

    var credentials = {
      key: privateKey,
      cert: certificate,
      passphrase:options.credentials.passphrase
    };

    options.port = process.env.PORT || options.port || 8453;
    app.set('port', options.port);
    exports.server =
      https.createServer(credentials, app)
      .listen(
        app.get('port'),
        launchServer
      );
  } else {
    options.port = process.env.PORT || options.port || 3010;
    app.set('port', options.port);
    exports.server =
      http.createServer(app)
      .listen(
        app.get('port'),
        launchServer
      );
  }
});

var launchServer = function() {
  var server = exports.server;
  log.debug('MemeGenerator server listening on port ' + server.address().port);
  model.sanitize();
  AppHandler.launch();
};
