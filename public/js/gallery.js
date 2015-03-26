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

app.filter('getAllFrameImageUrl',function() {
  return function(meme) {
    if (meme.template) {
      console.log("MEME TEMPLATE");
      console.dir(meme.template);
      return "/service/getTemplateAllFrames/"+meme.template._id+"?messages="+Base64.encode(JSON.stringify(meme.messages));
    } else {
      return "";
    }
  };
});

app.filter('getFirstFrameImageUrl', function() {
  return function(meme) {
    if (meme.template) {
      console.log("MEME TEMPLATE");
      console.dir(meme.template);
      if (meme.template.animated) {
        console.log("MEME IS ANIMATED");
        return "/service/getTemplateFirstFrame/"+meme.template._id+"?messages="+Base64.encode(JSON.stringify(meme.messages));
      } else {
        return "/service/getTemplateAllFrames/"+meme.template._id+"?messages="+Base64.encode(JSON.stringify(meme.messages));
      }
    } else {
      return "";
    }
  };
});

app.filter('fromNow', function() {
  return function(timestamp) {
    return moment(timestamp).fromNow();
  };
});

app.directive('relativeTime',
  [
    '$timeout',
    '$filter',
    function($timeout, $filter) {
      return function(scope, element, attrs) {
        var time = parseInt(attrs.relativeTime);
        var intervalLength = 1000 * 10; // 10 seconds
        var filter = $filter('fromNow');
        var timeoutId;

        function updateTime() {
          element.text(filter(time));
        }

        function updateLater() {
          timeoutId = $timeout(function() {
            updateTime();
            updateLater();
          }, intervalLength);
        }

        element.bind('$destroy', function() {
          $timeout.cancel(timeoutId);
        });

        updateTime();
        updateLater();
      };

    }
  ]
);

app.filter('linkify', ['$sce', function($sce) {
  return function(text) {
    return $sce.trustAsHtml(Autolinker.link(text));
  };
}]);

app.filter('trust', ['$sce', function($sce) {
  return function(text) {
    return $sce.trustAsHtml(text);
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
        console.log("POST");
        console.dir(attrs);
        console.dir(element);

        /*
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
         */
  };

  return {
    compile: compile,
    restrict: 'E',
    scope: {
      meme: '=info'
    },
    template:'<div class="col-md-12" style="padding: 5px 0px;">'+
                 '<img style="width:100%;" ng-src="{{meme.url}}"></img>'+
                 '</div>'
  };
});

app.directive('hoverImage',function(){
  return {
    link: function(scope, elm, attrs){
      console.log("CREATED HOVERIMAGE");
      elm[0].src = attrs.normalImage;
      var normalImage = new Image();
      normalImage.src = attrs.normalImage;
      var hoverImage = new Image();
      hoverImage.src = attrs.hoverImage;

      elm.bind('mouseenter',function(){
        console.log("setting hover image");
        this.src = hoverImage.src;
      });
      elm.bind('mouseleave',function(){
        console.log("Setting normal image");
        this.src = normalImage.src;
      });
    }
  };
});

var myself = {
  voted: {'1':true},
  downvoted: {'2':true}
};

var chats = [
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  },
  {
    '_id':'1',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  },
  {
    '_id':'2',
    'author':'123',
    'message':'Hello world.  http://www.google.com.  www.google.com. #baller @10ghost',
    'timestamp':Date.now()
  }
];

app.controller('MainGalleryController', ['dictionaryCache', '$scope', 'retryHttp', '$timeout', '$location', '$routeParams', 'dataCache', function(dictionaryCache, $scope, retryHttp, $timeout, $location, $routeParams, dataCache) {
  var galleryType = $location.path().split('/')[1];
  console.log(galleryType);
  if (galleryType == 'recent') {
    console.log("FETCHING");
    retryHttp.get('/service/recent/0/30', function(data, status, headers, config) {
      console.log("GOT MEMES");
      console.dir(data);
      async.map(data, function(meme, callback) {
        dictionaryCache.get('template',meme.templateId,function(template) {
          meme.template = template;
          console.log("ADDED TEMPLATE");
          console.dir(template);
          callback(null, meme);
        });
      }, function(err, memesWithTemplates) {
        $scope.memes = memesWithTemplates;
      });
    });
  }

  $scope.vote = function(memeId, up) {
    // TODO: Hit server
    console.log(memeId);
    if (up) {
      //$scope.memes[memeId].votes++;
    } else {
      //$scope.memes[memeId].votes--;
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

app.controller('MainMemeController', ['$routeParams', '$scope', 'retryHttp', '$timeout', '$location', 'dictionaryCache', function($routeParams, $scope, retryHttp, $timeout, $location, dictionaryCache) {
  retryHttp.get("/service/getMeme/"+$routeParams.memeId, function(result) {
    $scope.meme = result;
    dictionaryCache.get('template',$scope.meme.templateId,function(template) {
      $scope.meme.template = template;
      console.log("ADDED TEMPLATE");
      console.dir(template);
    });
  });

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

app.controller('CreateMemeController', ['dataCache', '$scope', 'retryHttp', '$timeout', '$location', '$sce', function(dataCache, $scope, retryHttp, $timeout, $location, $sce) {
  dataCache.get('allTemplates', function(data) {
    $scope.templates = $scope.allTemplates = data;
  });
  $scope.templateSelected = null;
  $scope.meme = {
    template:null,
    messages:[
      {
        'valign':'top',
        'halign':'center',
        'content':''
      },
      {
        'valign':'center',
        'halign':'center',
        'content':''
      },
      {
        'valign':'bottom',
        'halign':'center',
        'content':''
      }
    ]
  };

  $scope.refreshTemplates = function(search) {
    if (!$scope.allTemplates) {
      return;
    }
    var templates = $scope.allTemplates;

    if (search.length==0) {
      $scope.templates = templates;
      return;
    }

    $scope.templates = [];
    for (var a=0;a<templates.length;a++) {
      if (templates[a].name.indexOf(search) != -1) {
        $scope.templates.push(templates[a]);
      }
    }

    if ($scope.templates.length==0) {
      // Keep increasing Levenshtein distance until we get something
      // or give up.
      for (var a=0;a<=10 && $scope.templates.length==0;a++) {
        for (var b=0;b<templates.length;b++) {
          // Get the edit distance
          var lDistance = new Levenshtein(templates[b].name, search).distance;

          // Do not penalize longer template names
          var lengthDiff = Math.max(0,templates[b].name.length - search.length);

          if (lDistance - lengthDiff <= a) {
            $scope.templates.push(templates[b]);
          }
        }
      }
    }
  };

  $scope.getAlignClass = function(slot, align) {
    var classes = ['btn','btn-default'];
    if ($scope.meme.messages[slot].halign == align) {
      classes.push('active');
    }
    return classes;
  };

  $scope.setAlign = function(slot, align) {
    $scope.meme.messages[slot].halign = align;
    $scope.forceRefreshMeme();
  };

  $scope.changeTemplate = function(item, model) {
    $scope.templateSelected = item;
  };

  $scope.$watch('templateSelected', function(newValue, oldValue) {
    console.log("NEW TEMPLATE");
    console.log(newValue);
    if (newValue) {
      // Hacky way to force the meme directive to recompile
      $scope.meme.template = null;
      $timeout(function() {
        $scope.meme.template = newValue;
      });
    }
  });

  $scope.forceRefreshMeme = function() {
    var template = $scope.meme.template;
    // Hacky way to force the meme directive to recompile
    $scope.meme.template = null;
    $timeout(function() {
      $scope.meme.template = template;
    });
  };

  $scope.$watch('topContent', function(newValue, oldValue) {
    $scope.meme.messages[0]['content'] = newValue;
    $scope.forceRefreshMeme();
  });
  $scope.$watch('middleContent', function(newValue, oldValue) {
    $scope.meme.messages[1]['content'] = newValue;
    $scope.forceRefreshMeme();
  });
  $scope.$watch('bottomContent', function(newValue, oldValue) {
    $scope.meme.messages[2]['content'] = newValue;
    $scope.forceRefreshMeme();
  });

  $scope.createMeme = function() {
    retryHttp.post("/service/createMeme", $scope.meme, function(result) {
      console.dir(result);
      var newMemeId = result._id;
      console.log("Created meme: " + newMemeId);
      $location.path("/meme/" + newMemeId);
    });
  };
}]);
