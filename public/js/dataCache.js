app.service('dataCache', ['retryHttp', '$log', function(retryHttp, $log) {
  var fetching = {};
  var cached = {};
  var fetch = {
    'myself':function(callback) {
      retryHttp.get('/service/myself', function(result) {
        callback(result);
      });
    }
  };
  return {
    // Get an item from the cache.  By default there is no
    // time-to-live.  Put 0 in ttl to always fetch from the server.
    get:function(key, callback, fetchFn, ttl) {
      if (key in cached && (ttl == null || cached[key].time >= (Date.now() - ttl*1000))) {
        callback(cached[key].data);
        return;
      }

      // cache miss, fetch from server
      fetch[key](function(result) {
        cached[key] = {
          time:Date.now(),
          data:result
        };
        callback(result);
      });
    }
  };
}]);
