var $ = require('jquery');

function logError(details) {
  $.ajax({
    type: 'POST',
    url: '/service/angularerror',
    data: JSON.stringify(details),
    contentType: 'application/json; charset=utf-8',
    complete:function(jqXHR, textStatus) {
      alert("Sorry, there was a fatal error. Redirecting to the home page.");
      window.location.href = "/";
    }
  });
}

window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
  var stack = "";
  if (errorObj && errorObj.stack) {
    stack = errorObj.stack;
  }
  logError({
    message:errorMsg,
    cause:null,
    context:navigator.userAgent,
    stack:stack,
    location : window.location,
    performance : window.performance
  });
};
