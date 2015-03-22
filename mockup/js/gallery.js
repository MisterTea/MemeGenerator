function copyToClipboard(text) {
  window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
}

app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/yours', {
        templateUrl: 'partials/gallery.html',
        controller: 'MainGalleryController'
      }).
      when('/recent', {
        templateUrl: 'partials/gallery.html',
        controller: 'MainGalleryController'
      }).
      when('/top/:range', {
        templateUrl: 'partials/gallery.html',
        controller: 'MainGalleryController'
      }).
      when('/meme/:memeId', {
        templateUrl: 'partials/meme.html',
        controller: 'MainMemeController'
      }).
      when('/creatememe', {
        templateUrl: 'partials/creatememe.html',
        controller: 'CreateMemeController'
      }).
      otherwise({
        redirectTo: '/top/daily'
      });
  }]);

app.filter('usernameFromId', function() {
  return function(input) {
    return 'Jason Gauci';
  };
});

app.filter('relativeTime', function() {
  return function(timestamp) {
    return '10 minutes ago';
  };
});

app.filter('linkify', ['$sce', function($sce) {
  return function(text) {
    return $sce.trustAsHtml(Autolinker.link(text));
  };
}]);

var createImage = function(messages, callback) {
  WebFont.load({
    custom: {
      families: ['ImpactServer']
    },
    active: function() {
      var img = document.createElement('img');
      img.src = "/images/Templates/One-Does-Not-Simply.jpg";
      img.onload = function() {
        var imageWidth = img.naturalWidth;
        var imageHeight = img.naturalHeight;
        var canvas = document.createElement('canvas');
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        var context = canvas.getContext('2d');
        context.drawImage(img,0,0);

        var fontSize = 48;

        var xValues = {
          'topleft':10,
          'middleleft':10,
          'bottomleft':10,

          'top':canvas.width/2,
          'middle':canvas.width/2,
          'bottom':canvas.width/2,

          'topright':canvas.width - 10,
          'middleright':canvas.width - 10,
          'bottomright':canvas.width - 10
        };
        var yValues = {
          'topleft':fontSize + 10,
          'middleleft':canvas.height/2,
          'bottomleft':canvas.height - 10,

          'top':fontSize + 10,
          'middle':canvas.height/2,
          'bottom':canvas.height - 10,

          'topright':fontSize + 10,
          'middleright':canvas.height/2,
          'bottomright':canvas.height - 10
        };
        var align = {
          'topleft':'start',
          'middleleft':'start',
          'bottomleft':'start',

          'top':'center',
          'middle':'center',
          'bottom':'center',

          'topright':'end',
          'middleright':'end',
          'bottomright':'end'
        };

        var key;
        for (key in messages) {
          var x = xValues[key];
          var y = yValues[key];
          var text = messages[key];

          context.font = fontSize+'px "ImpactServer"';
          context.textAlign = align[key];
          context.fillStyle = 'white';
          context.strokeStyle = 'black';
          context.lineWidth = 2;

          // http://stackoverflow.com/questions/13627111/drawing-text-with-an-outer-stroke-with-html5s-canvas
          context.miterLimit = 2;

          context.fillText(text, x, y);
          context.strokeText(text, x, y);

          // get text metrics
          var metrics = context.measureText(text);
        }
        //var width = metrics.width;
        //context.font = '20pt Calibri';
        //context.textAlign = 'center';
        //context.fillStyle = '#555';
        //context.fillText('(' + width + 'px wide)', x, y + 40);

        // save canvas image as data url (png format by default)
        var dataURL = canvas.toDataURL();

        callback(dataURL, canvas.width, canvas.height);
      };

    }
  });
};

app.directive('memegallery', function($compile) {
  var compile = function(element, attrs) {
    return {
      post: function(scope, element, attrs) {
        console.log("POST");
        console.dir(scope.meme);
        createImage(scope.meme.messages, function(imageData, width, height) {
          // set canvasImg image src to dataURL
          // so it can be saved as an image
          var canvasImage = element.find('img')[0];
          var memeAnchor = element.find('a')[0];
          //canvasImage.style.width = width;
          //canvasImage.style.height = height;
          canvasImage.src = imageData;
          canvasImage.download = "meme.png";

          //memeAnchor.href = imageData;
          //memeAnchor.download = "meme.png";
        });
        console.dir(element.find('a')[0]);
        console.dir(element.find('img')[0]);
      }
    };
  };

  return {
    compile: compile,
    restrict: 'E',
    scope: {
      meme: '=info'
    },
    template:'<div class="col-md-12" style="padding: 5px 0px;">'+
                 '<a ng-href="/#/meme/{{meme._id}}">'+
                 '<img style="width:100%;" ng-src="{{meme.url}}"></img>'+
                 '</a>'+
                 '</div>'
  };
});

app.directive('memedetail', function($compile) {
  var compile = function(element, attrs) {
    return {
      post: function(scope, element, attrs) {
        console.log("POST");
        console.dir(scope.meme);
        if (!scope.meme) {
          return;
        }

        createImage(scope.meme.messages, function(imageData, width, height) {
          // set canvasImg image src to dataURL
          // so it can be saved as an image
          var canvasImage = element.find('img')[0];
          var memeAnchor = element.find('a')[0];
          //canvasImage.style.width = width;
          //canvasImage.style.height = height;
          canvasImage.src = imageData;
          canvasImage.download = "meme.png";

          memeAnchor.href = imageData;
          memeAnchor.download = "meme.png";
        });
        console.dir(element.find('a')[0]);
        console.dir(element.find('img')[0]);
      }
    };
  };

  return {
    compile: compile,
    restrict: 'E',
    scope: {
      meme: '=info'
    },
    template:'<div class="col-md-12" style="padding: 5px 0px;">'+
                 '<a ng-href="/gallery.html#/meme/{{meme._id}}">'+
                 '<img style="width:100%;" ng-src="{{meme.url}}"></img>'+
                 '</a>'+
                 '</div>'
  };
});

var memes = {
  "1":{
    _id:"1",
    url:"/images/Templates/One-Does-Not-Simply.jpg",
    messages:{
      top:"Hello World"
    },
    votes:10,
    creator:'123'
  },
  "2":{
    _id:"2",
    url:"/images/Templates/One-Does-Not-Simply.jpg",
    messages:{
      middle:"Hello World"
    },
    votes:10,
    creator:'123'
  },
  "3":{
    _id:"3",
    url:"/images/Templates/One-Does-Not-Simply.jpg",
    messages:{
      bottom:"Hello World"
    },
    votes:10,
    creator:'123'
  },
  "4":{
    _id:"4",
    url:"/images/Templates/One-Does-Not-Simply.jpg",
    messages:{
      bottomright:"Hello World"
    },
    votes:10,
    creator:'123'
  },
  "5":{
    _id:"5",
    url:"/images/Templates/One-Does-Not-Simply.jpg",
    messages:{
      bottomleft:"Hello World"
    },
    votes:10,
    creator:'123'
  },
  "6":{
    _id:"6",
    url:"/images/Templates/One-Does-Not-Simply.jpg",
    messages:{
      bottom:"Hello World"
    },
    votes:10,
    creator:'123'
  }
};

var myself = {
  voted: {'1':true},
  downvoted: {'2':true}
};

var chats = [
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  },
  {
    '_id':'2',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost'
  }
];

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

app.service('dataCache', ['retryHttp', '$log', function(retryHttp, $log) {
  var fetching = {};
  var cached = {};
  return {
    // Get an item from the cache.  By default there is no
    // time-to-live.  Put 0 in ttl to always fetch from the server.
    get:function(url, callback, errorCallback, ttl) {
      var key = url;
      if (key in cached && (ttl == null || cached[key].time >= (Date.now() - ttl*1000))) {
        callback(cached[key].data);
        return;
      }
    }
  };
}]);

app.controller('MainGalleryController', ['$scope', 'retryHttp', '$timeout', '$location', '$routeParams', 'dataCache', function($scope, retryHttp, $timeout, $location, $routeParams, dataCache) {
  $scope.memes = memes;

  $scope.vote = function(memeId, up) {
    // TODO: Hit server
    console.log(memeId);
    if (up) {
      $scope.memes[memeId].votes++;
    } else {
      $scope.memes[memeId].votes--;
    }
  };

  $scope.voteColor = function(memeId) {
    if (memeId in myself.voted) {
      return 'green';
    } else if (memeId in myself.downvoted) {
      return 'red';
    } else {
      return 'grey';
    }
  };

  $scope.copyLink = function(url) {
    copyToClipboard($location.protocol() +
                    "://" +
                    $location.host() +
                    ":" +
                    $location.port() +
                    url);
  };
}]);

app.controller('MainMemeController', ['$scope', 'retryHttp', '$timeout', '$location', function($scope, retryHttp, $timeout, $location) {
  $scope.meme = memes['1'];
  $scope.chats = chats;

  $scope.vote = function(memeId, up) {
    // TODO: Hit server
    console.log(memeId);
    if (up) {
      $scope.meme.votes++;
    } else {
      $scope.meme.votes--;
    }
  };

  $scope.voteColor = function(memeId) {
    if (memeId in myself.voted) {
      return 'green';
    } else if (memeId in myself.downvoted) {
      return 'red';
    } else {
      return 'grey';
    }
  };

  $scope.copyLink = function(url) {
    copyToClipboard($location.protocol() +
                    "://" +
                    $location.host() +
                    ":" +
                    $location.port() +
                    url);
  };
}]);

var templates = {
  '1':{
    '_id':'1',
    'name':'xzibit',
    'image':'123'
  },
  '2':{
    '_id':'2',
    'name':'xzibit2',
    'image':'123'
  }
};

app.controller('CreateMemeController', ['$scope', 'retryHttp', '$timeout', '$location', function($scope, retryHttp, $timeout, $location) {
  $scope.templates = templates;
  $scope.templateSelected = null;
  $scope.meme = {
    template:null,
    messages:{
      'top':{
        'align':'center',
        'content':''
      },
      'middle':{
        'align':'center',
        'content':''
      },
      'bottom':{
        'align':'center',
        'content':''
      }
    }
  };

  $scope.getAlignClass = function(slot, align) {
    var classes = ['btn','btn-default'];
    if ($scope.meme.messages[slot].align == align) {
      classes.push('active');
    }
    return classes;
  };

  $scope.setAlign = function(slot, align) {
    $scope.meme.messages[slot].align = align;
  };

  $scope.$watch('templateSelected', function(newValue, oldValue) {
    console.log("TEMPLATE CHANGED: " + oldValue + " -> " + newValue);
    var templateId;
    for (templateId in $scope.templates) {
      if ($scope.templates[templateId].name == newValue) {
        $scope.meme.template = templateId;
        break;
      }
    }
  });

  $scope.$watch('meme', function(newValue, oldValue) {
    console.log("MEME CHANGED");
    console.dir(newValue);
  }, true);

  $scope.$watch('topContent', function(newValue, oldValue) {
    $scope.meme.messages['top']['content'] = newValue;
  });
  $scope.$watch('middleContent', function(newValue, oldValue) {
    $scope.meme.messages['middle']['content'] = newValue;
  });
  $scope.$watch('bottomContent', function(newValue, oldValue) {
    $scope.meme.messages['bottom']['content'] = newValue;
  });
}]);
