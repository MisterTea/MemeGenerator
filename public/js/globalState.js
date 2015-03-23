app.service('globalState', ['$rootScope', 'retryHttp', function($rootScope, retryHttp) {
  var state = {
  };
  var get = function(key){
    return state[key];
  };
  var set = function(key,value) {
    console.log("SETTING " + key + " " + JSON.stringify(value));
    state[key] = value;
    $rootScope.$broadcast('globalStateUpdate', {key:key,value:value});
  };
  var push = function(key) {
  };
  var setAndPush = function(key,value) {
    set(key,value);
    push(key);
  };
  return {
    get:get,
    set:set,
    push:push,
    setAndPush:setAndPush
  };
}]);
