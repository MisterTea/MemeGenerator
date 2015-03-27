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
        redirectTo: '/top/weekly'
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
        var time = attrs.relativeTime;
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

app.filter('addHttpToUrl', [function() {
  return function(s) {
    if (!s.match(/^[a-zA-Z]+:\/\//))
    {
      s = 'http://' + s;
    }
    return s;
  };
}]);

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

var addMemeControls = function(dictionaryCache, $scope, retryHttp, $timeout, $location, $routeParams, dataCache) {
  $scope.myself = null;
  dataCache.get('myself', function(myself) {
    $scope.myself = myself;
  });

  $scope.users = {};
  $scope.getUserFullName = function(id) {
    if (!id) {
      return "Loading...";
    }

    if (id in $scope.users) {
      console.log("CACHED USER " + $scope.users[id].fullName);
      return $scope.users[id].fullName;
    } else {
      console.log("FETCHING USER");
      dictionaryCache.get('user',id,function(user) {
        console.log("GOT USER");
        $scope.users[id] = user;
      });
      return "Loading...";
    }
  };

  $scope.vote = function(memeId, up) {
    console.log(memeId);
    retryHttp.post('/service/vote/'+memeId,{'up':up},function(newMeme) {
      for (var a=0;a<$scope.memes.length;a++) {
        console.log("REPLACING MEME");
        if ($scope.memes[a]._id == newMeme._id) {
          var template = $scope.memes[a].template;
          $scope.memes[a] = newMeme;
          $scope.memes[a].template = template;
          break;
        }
      }
    });
  };

  $scope.voteColor = function(meme) {
    if (!meme) {
      return 'grey';
    }

    console.log("MEME");
    console.dir(meme);
    console.log($scope.myself);

    if (_.indexOf(meme.votes,$scope.myself._id)>-1) {
      return 'green';
    } else if (meme.downvotes && _.indexOf(meme.downvotes,$scope.myself._id)>-1) {
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
};

app.controller('MainGalleryController', ['dictionaryCache', '$scope', 'retryHttp', '$timeout', '$location', '$routeParams', 'dataCache', function(dictionaryCache, $scope, retryHttp, $timeout, $location, $routeParams, dataCache) {
  var galleryType = $location.path();
  console.log(galleryType);
  var fetchUrl = null;
  if (galleryType == '/recent') {
    fetchUrl = '/service/recent/0/30';
  } else if (galleryType == '/top/weekly') {
    fetchUrl = '/service/top/weekly/0/30';
  } else if (galleryType == '/top/alltime') {
    fetchUrl = '/service/top/alltime/0/30';
  }
  console.log("FETCHING");
  retryHttp.get(fetchUrl, function(data, status, headers, config) {
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

  addMemeControls(dictionaryCache, $scope, retryHttp, $timeout, $location, $routeParams, dataCache);
}]);

app.controller('MainMemeController', ['$routeParams', '$scope', 'retryHttp', '$timeout', '$location', 'dictionaryCache', 'dataCache', function($routeParams, $scope, retryHttp, $timeout, $location, dictionaryCache, dataCache) {
  retryHttp.get("/service/getMeme/"+$routeParams.memeId, function(result) {
    $scope.meme = result;
    dictionaryCache.get('template',$scope.meme.templateId,function(template) {
      $scope.meme.template = template;
      console.log("ADDED TEMPLATE");
      console.dir(template);
    });
  });

  addMemeControls(dictionaryCache, $scope, retryHttp, $timeout, $location, $routeParams, dataCache);

  $scope.addChat = function() {
    console.log("Adding chat: " + $scope.chatInput);
    retryHttp.post("/service/addChat/"+$scope.meme._id, {chat:$scope.chatInput}, function(result) {
      var template = $scope.meme.template;
      $scope.meme = result;
      $scope.meme.template = template;
    });
    $scope.chatInput = "";

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
