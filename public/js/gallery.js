var app = app;

app.filter('getMemeAllFramesImageUrl',function() {
  return function(meme) {
    if (meme.template) {
      return "/service/getMemeAllFrames/"+meme._id;
    } else {
      return "";
    }
  };
});

app.filter('getMemeFirstFrameImageUrl', function() {
  return function(meme) {
    if (meme.template) {
      if (meme.template.animated) {
        return "/service/getMemeFirstFrame/"+meme._id;
      } else {
        return "/service/getMemeAllFrames/"+meme._id;
      }
    } else {
      return "";
    }
  };
});

app.filter('getTemplateAllFramesImageUrl',function() {
  return function(meme) {
    if (meme.template) {
      return "/service/getTemplateAllFrames/"+meme.template._id+"?messages="+Base64.encode(JSON.stringify(meme.messages));
    } else {
      return "";
    }
  };
});

app.filter('getTemplateFirstFrameImageUrl', function() {
  return function(meme) {
    if (meme.template) {
      if (meme.template.animated) {
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

var debounceCount=0;
var debounceReload = function($timeout, callback) {
  debounceCount++;
  $timeout(function() {
    debounceCount--;
    if (debounceCount==0) {
      callback();
    }
  }, 100);
};

app.directive('hoverImage', ['$timeout', '$rootScope', function($timeout, $rootScope){
  return {
    link: function(scope, elm, attrs){
      console.log("CREATED HOVERIMAGE");
      elm[0].src = attrs.normalImage;
      var normalImage = new Image();
      normalImage.src = attrs.normalImage;
      var hoverImage = new Image();
      hoverImage.src = attrs.hoverImage;
      var inCache=false;

      var finishedLoadingGallery = function() {
        console.log("RELOADING MASONRY");
        $rootScope.$broadcast('galleryIsReady');
      };

      normalImage.onload = function() {
        if (!inCache) {
          debounceReload($timeout, finishedLoadingGallery);
        }
      };
      if (normalImage.complete) {
        debounceReload($timeout, finishedLoadingGallery);
        inCache=true;
      }

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
}]);

var addMemeControls = function(dictionaryCache, $scope, retryHttp, $timeout, $location, $routeParams, dataCache, $modal, $rootScope) {
  $scope.myself = null;
  dataCache.get('myself', function(myself) {
    $scope.myself = myself;
  });

  $scope.memes = [];
  $scope.users = {};
  $scope.getUserFullName = function(id) {
    if (!id) {
      return "Loading...";
    }
    return $scope.users[id].fullName;
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

    if (_.indexOf(meme.votes,$scope.myself._id)>-1) {
      return 'green';
    } else if (meme.downvotes && _.indexOf(meme.downvotes,$scope.myself._id)>-1) {
      return 'red';
    } else {
      return 'grey';
    }
  };

  $scope.createEmbeddedHtml = function(memeId) {
    var baseUrl = $location.protocol() +
          "://" +
          $location.host() +
          ":" +
          $location.port();
    retryHttp.get(
      baseUrl + "/service/getMemeUriAllFrames/" + memeId,
      function(data, status, headers, config) {
        var base64Img = data;
        var anchorUrl = baseUrl + '/view#/meme/' + memeId;
        var embedText = "<a href=\""+anchorUrl+"\"><img src=\""+base64Img+"\"></img></a>";
        var modalInstance = $modal.open({
          templateUrl: 'copyMemeModalContent.html',
          controller: 'CopyMemeModalInstanceCtrl',
          resolve: {
            embedText: function() {
              return embedText;
            }
          }
        });
      },
      function(data, status, headers, config) {
        // TODO: Handle error
      });
  };

  $scope.createdByMyself = function(meme) {
    if (!meme) {
      return false;
    }
    return meme.creatorId == $scope.myself._id;
  };

  $scope.$on('galleryIsReady', function() {
    console.log("SHOWING GALLERY");
    $scope.showGallery = true;
    $rootScope.$broadcast('masonry.reload');
  });
};

app.directive('selectOnLoad', function($timeout) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      $timeout(function() {
        console.log("ELEMENT");
        console.dir(element[0]);
        element[0].select();
      }, 100);
    }
  };
});

app.controller('CopyMemeModalInstanceCtrl', function (alertService, $scope, retryHttp, $modalInstance, $timeout, embedText) {
  $scope.ok = function () {
    $modalInstance.close();
  };
  console.log("EMBED TEXT");
  console.dir(embedText);
  $scope.embedText = embedText;
});

app.controller('MainGalleryController', ['dictionaryCache', '$scope', 'retryHttp', '$timeout', '$location', '$routeParams', 'dataCache', '$modal', '$rootScope', function(dictionaryCache, $scope, retryHttp, $timeout, $location, $routeParams, dataCache, $modal, $rootScope) {
  $scope.showGallery = false;
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
      async.map(memesWithTemplates, function(meme, callback) {
        var img = new Image();
        var cached = false;
        img.onload = function() {
          console.log("ONLOAD CALLED");
          if (!cached) {
            console.log("NOT CACHED");
            callback(null, meme);
          }
        };
        if (meme.template.animated) {
          img.src = "/service/getMemeFirstFrame/"+meme._id;
        } else {
          img.src = "/service/getMemeAllFrames/"+meme._id;
        }
        if (img.complete) {
          console.log("IMAGE FETCHED FROM CACHE");
          cached = true;
          callback(null, meme);
        } else {
          console.log("WAITING FOR ONLOAD");
        }
      }, function(err, memesWithTemplates) {
        var usersToFetch = [];
        for (var a=0;a<memesWithTemplates.length;a++) {
          usersToFetch.push(memesWithTemplates[a].creatorId);
        }
        async.map(usersToFetch, function(id, callback) {
          dictionaryCache.get('user',id,function(user) {
            callback(null, user);
          });
        }, function(err, users) {
          $scope.memes = memesWithTemplates;
          for (var a=0;a<users.length;a++) {
            $scope.users[users[a]._id] = users[a];
          }
          console.log("Showing gallery");
          if(!$scope.$$phase) {
            $scope.$apply();
          }
        });
      });
    });
  });

  addMemeControls(dictionaryCache, $scope, retryHttp, $timeout, $location, $routeParams, dataCache, $modal, $rootScope);

  $scope.deleteMeme = function(memeId) {
    var modalInstance = $modal.open({
      templateUrl: 'deleteMemeModalContent.html',
      controller: 'DeleteMemeModalInstanceCtrl',
      resolve: {
      }
    });
    modalInstance.result.then(function (newTemplate) {
      retryHttp.post("/service/deleteMeme/"+memeId, {}, function(result) {
        if (result) {
          for (var a=0;a<$scope.memes.length;a++) {
            if ($scope.memes[a]._id == memeId) {
              $scope.memes.splice(a,1);
              break;
            }
          }
        }
      });
    }, function () {
      console.log('Modal dismissed at: ' + new Date());
    });
  };
}]);

app.controller('MainMemeController', ['$routeParams', '$scope', 'retryHttp', '$timeout', '$location', 'dictionaryCache', 'dataCache', '$modal', '$rootScope', function($routeParams, $scope, retryHttp, $timeout, $location, dictionaryCache, dataCache, $modal, $rootScope) {
  retryHttp.get("/service/getMeme/"+$routeParams.memeId, function(result) {
    dictionaryCache.get('template',result.templateId,function(template) {
      var meme = result;
      meme.template = template;
      var usersToFetch = [meme.creatorId];
      for (var a=0;a<meme.chatlog.length;a++) {
        usersToFetch.push(meme.chatlog[a].creatorId);
      }
      usersToFetch = _.uniq(usersToFetch);
      async.map(usersToFetch, function(id, callback) {
        dictionaryCache.get('user',id,function(user) {
          callback(null, user);
        });
      }, function(err, users) {
        for (var a=0;a<users.length;a++) {
          $scope.users[users[a]._id] = users[a];
        }
        $scope.memes = [meme];
      });
    });
  });

  addMemeControls(dictionaryCache, $scope, retryHttp, $timeout, $location, $routeParams, dataCache, $modal, $rootScope);

  $scope.deleteMeme = function(memeId) {
    var modalInstance = $modal.open({
      templateUrl: 'deleteMemeModalContent.html',
      controller: 'DeleteMemeModalInstanceCtrl',
      resolve: {
      }
    });
    modalInstance.result.then(function (newTemplate) {
      retryHttp.post("/service/deleteMeme/"+$scope.memes[0]._id, {}, function(result) {
        if (result) {
          $location.path("/recent");
        }
      });
    }, function () {
      console.log('Modal dismissed at: ' + new Date());
    });
  };

  $scope.addChat = function() {
    console.log("Adding chat: " + $scope.chatInput);
    retryHttp.post("/service/addChat/"+$scope.memes[0]._id, {chat:$scope.chatInput}, function(result) {
      var template = $scope.memes[0].template;
      $scope.memes[0] = result;
      $scope.memes[0].template = template;
    });
    $scope.chatInput = "";

  };
}]);

app.controller('DeleteMemeModalInstanceCtrl', function (alertService, $scope, retryHttp, $modalInstance, $timeout) {
  $scope.yes = function () {
    $modalInstance.close();
  };
  $scope.no = function() {
    $modalInstance.dismiss('cancel');
  };
});

app.controller('CreateMemeController', ['dataCache', '$modal', '$scope', 'retryHttp', '$timeout', '$location', '$sce', function(dataCache, $modal, $scope, retryHttp, $timeout, $location, $sce) {
  // Necessary so we can clear/restore meme.template to refresh the
  // meme image
  $scope.templateSelected = false;

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

  $scope.templateName = {};
  $scope.changeTemplate = function(item) {
    console.log("MODEL");
    console.dir($scope.templateName.selected);
    console.dir($scope.$item);
    if (item) {
      $scope.templateSelected = true;
    }
    console.log("NEW TEMPLATE");
    console.log(item);
    if (item) {
      // Hacky way to force the meme directive to recompile
      $scope.meme.template = null;
      $timeout(function() {
        $scope.meme.template = item;
      });
    }
  };

  var refreshSemaphore=0;
  $scope.forceRefreshMeme = function() {
    refreshSemaphore++;
    $timeout(function() {
      refreshSemaphore--;
      if (refreshSemaphore==0) {
        var template = $scope.meme.template;
        // Hacky way to force the meme directive to recompile
        $scope.meme.template = null;
        $timeout(function() {
          $scope.meme.template = template;
        });
      }
    }, 500);
  };

  $scope.$watch('topContent', function(newValue, oldValue) {
    if (!newValue) {
      $scope.meme.messages[0]['content'] = "";
    } else {
      $scope.meme.messages[0]['content'] = newValue.toUpperCase();
    }
    $scope.forceRefreshMeme();
  });
  $scope.$watch('middleContent', function(newValue, oldValue) {
    if (!newValue) {
      $scope.meme.messages[1]['content'] = "";
    } else {
      $scope.meme.messages[1]['content'] = newValue.toUpperCase();
    }
    $scope.forceRefreshMeme();
  });
  $scope.$watch('bottomContent', function(newValue, oldValue) {
    if (!newValue) {
      $scope.meme.messages[2]['content'] = "";
    } else {
      $scope.meme.messages[2]['content'] = newValue.toUpperCase();
    }
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

  $scope.createTemplateDialog = function() {
    console.log("GOING TO CREATE TEMPLATE");
    var modalInstance = $modal.open({
      templateUrl: 'createTemplateModalContent.html',
      controller: 'CreateTemplateModalInstanceCtrl',
      resolve: {
      }
    });

    modalInstance.result.then(function (newTemplate) {
      $scope.allTemplates.push(newTemplate);
      // TODO: Should we update the query here?
      $scope.changeTemplate(newTemplate);
      $scope.templateName.selected = newTemplate;
    }, function () {
      console.log('Modal dismissed at: ' + new Date());
    });
  };

  dataCache.get('allTemplates', function(data) {
    $scope.templates = $scope.allTemplates = data;
    console.dir(data);
    var initialTemplateId = $location.search()['templateId'];
    if (initialTemplateId) {
      for (var a=0;a<$scope.allTemplates.length;a++) {
        if ($scope.allTemplates[a]._id == initialTemplateId) {
          $scope.changeTemplate($scope.allTemplates[a]);
          $scope.templateName.selected = $scope.allTemplates[a];
          break;
        }
      }
    }
  });
}]);

app.controller('CreateTemplateModalInstanceCtrl', function (alertService, $scope, retryHttp, $modalInstance, $timeout) {
  $scope.ok = function () {
    var isValid=(function(){
      var rg1=/^[^\\/:\*\?"<>\|]+$/; // forbidden characters \ / : * ? " < > |
      var rg2=/^\./; // cannot start with dot (.)
      var rg3=/^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
      return function isValid(fname){
        return rg1.test(fname)&&!rg2.test(fname)&&!rg3.test(fname);
      };
    })();

    if (!$scope.templateName || $scope.templateName.length==0) {
      alertService.pushAlert('warning', 'Please add a template name', 5000);
      return;
    }
    if (!$scope.mime) {
      alertService.pushAlert('warning', 'Please drag an image from your computer to the dialog.', 5000);
      return;
    }
    if (!isValid($scope.templateName)) {
      alertService.pushAlert('warning', 'Invalid template name (must be a valid filename)', 5000);
      return;
    }

    // Create the new template
    retryHttp.post(
      '/service/createTemplate',{
        'name':$scope.templateName,
        'base64':$scope.base64,
        'mime':$scope.mime
      }, function(result) {
        $modalInstance.close(result);
      });
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $timeout(function() {
    console.log("SETTING UP FILEDROP");
    // Tell FileDrop we can deal with iframe uploads using this URL:
    var options = {input:false};

    // Attach FileDrop to an area
    var zone = new FileDrop('createTemplateModal', options);

    // Do something when a user chooses or drops a file:
    zone.event('send', function (files) {
      // Depending on browser support files (FileList) might contain multiple items.
      files.each(function (file) {
        console.log(file);
        //alert(file.name + ' ' + file.type + ' (' + file.size + ') bytes');
        var fr = new FileReader();

        // For some reason onload is being called 2x.
        var called=false;
        fr.onload = function(e) {
          if (called) return;
          called = true;
          if(file.type.match(/image.*/)){
            //console.log("SETTING FILE PARAMS");
            $scope.$apply(function() {
              $scope.mime = e.target.result.split(',')[0].substring(5).split(';')[0];
              $scope.base64 = e.target.result.split(',')[1];
              $scope.imageUri = 'data:'+$scope.mime+';base64,'+$scope.base64;
              //console.log($scope.imageUri);
            });
          } else {
            // Regular attachment (do nothing)
          }
        };
        fr.readAsDataURL(file.nativeFile);
      });
    });
  });
});
