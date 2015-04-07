function copyToClipboard(text) {
  window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
}

app.filter('usernameFromId', function() {
  return function(input) {
    return 'Jason Gauci';
  };
});

app.filter('getMemeAllFramesImageUrl',function() {
  return function(meme) {
    if (meme.template) {
      console.log("MEME TEMPLATE");
      console.dir(meme.template);
      return "/service/getMemeAllFrames/"+meme._id;
    } else {
      return "";
    }
  };
});

app.filter('getMemeFirstFrameImageUrl', function() {
  return function(meme) {
    if (meme.template) {
      console.log("MEME TEMPLATE");
      console.dir(meme.template);
      if (meme.template.animated) {
        console.log("MEME IS ANIMATED");
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
      console.log("MEME TEMPLATE");
      console.dir(meme.template);
      return "/service/getTemplateAllFrames/"+meme.template._id+"?messages="+Base64.encode(JSON.stringify(meme.messages));
    } else {
      return "";
    }
  };
});

app.filter('getTemplateFirstFrameImageUrl', function() {
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

  $scope.forceRefreshMeme = function() {
    var template = $scope.meme.template;
    // Hacky way to force the meme directive to recompile
    $scope.meme.template = null;
    $timeout(function() {
      $scope.meme.template = template;
    });
  };

  $scope.$watch('topContent', function(newValue, oldValue) {
    if (newValue && newValue != newValue.toUpperCase()) {
      $scope.topContent = newValue.toUpperCase();
      return;
    }
    $scope.meme.messages[0]['content'] = newValue;
    $scope.forceRefreshMeme();
  });
  $scope.$watch('middleContent', function(newValue, oldValue) {
    if (newValue && newValue != newValue.toUpperCase()) {
      $scope.middleContent = newValue.toUpperCase();
      return;
    }
    $scope.meme.messages[1]['content'] = newValue;
    $scope.forceRefreshMeme();
  });
  $scope.$watch('bottomContent', function(newValue, oldValue) {
    if (newValue && newValue != newValue.toUpperCase()) {
      $scope.bottomContent = newValue.toUpperCase();
      return;
    }
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
