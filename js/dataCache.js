var app = require('./app').app;

app.service('dataCache', ['retryHttp', '$log', '$timeout', function(retryHttp, $log, $timeout) {
  var fetching = {};
  var cached = {};
  var fetch = {
    'myself':function(callback) {
      retryHttp.get('/service/me', function(result) {
        callback(result);
      });
    },
    'allTemplates':function(callback) {
      retryHttp.get('/service/getAllTemplates', function(result) {
        callback(result);
      });
    }
  };

  // Get an item from the cache.  By default there is no
  // time-to-live.  Put 0 in ttl to always fetch from the server.
  var get = function(key, callback, ttl) {
    if (fetching[key]) {
      // Already fetching this, wait 10ms then retry
      $timeout(function() {
        get(key,callback,ttl);
      }, 10);
      return;
    }

    if (key in cached && (ttl == null || cached[key].time >= (Date.now() - ttl*1000))) {
      callback(cached[key].data);
      return;
    }

    // cache miss, fetch from server
    fetching[key] = true;
    fetch[key](function(result) {
      cached[key] = {
        time:Date.now(),
        data:result
      };
      delete fetching[key];
      callback(result);
    });
  };

  return {
    get:get
  };
}]);

app.service('dictionaryCache', ['retryHttp', '$log', '$timeout', function(retryHttp, $log, $timeout) {
  var fetching = {
  };
  var cached = {
  };
  var fetch = {
    'template':function(key, callback) {
      retryHttp.get('/service/getTemplate/'+key, function(result) {
        callback(result);
      });
    },
    'user':function(key, callback) {
      retryHttp.get('/service/getUser/'+key, function(result) {
        callback(result);
      });
    }
  };

  var genre;
  for (genre in fetch) {
    fetching[genre] = {};
    cached[genre] = {};
  }

  // Get an item from the cache.  By default there is no
  // time-to-live.  Put 0 in ttl to always fetch from the server.
  var get = function(genre, key, callback, ttl) {
    if (fetching[genre][key]) {
      // Already fetching this, wait 10ms then retry
      $timeout(function() {
        get(genre,key,callback,ttl);
      }, 10);
      return;
    }

    if (key in cached[genre] && (ttl == null || cached[genre][key].time >= (Date.now() - ttl*1000))) {
      callback(cached[genre][key].data);
      return;
    }

    // cache miss, fetch from server
    fetching[genre][key] = true;
    fetch[genre](key, function(result) {
      cached[genre][key] = {
        time:Date.now(),
        data:result
      };
      delete fetching[genre][key];
      callback(result);
    });
  };

  return {
    get:get
  };
}]);
