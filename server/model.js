var mongoose = require('mongoose');
var options = require('./options-handler').options;
var log = require('./logger').log;

// Logs to debug every database query
mongoose.set('debug', options['database']['debug']);

var ObjectId = mongoose.Schema.Types.ObjectId;
var Mixed = mongoose.Schema.Types.Mixed;

// Ensures that the entry is a valid object ID
var isObjectId = function(n) {
  if (!n) {
    // Allow null/undefined
    return true;
  }

  if (typeof n.toString === 'function') {
    return mongoose.Types.ObjectId.isValid(n.toString());
  } else {
    return false;
  }
};

// Ensures that the entry is an array of valid object IDs
var isObjectIdArray = function(n) {
  if (!n) {
    // Allow null/undefined
    return true;
  }

  if (!Array.isArray(n)) {
    return false;
  }
  for (var a=0;a<n.length;a++) {
    if (!isObjectId(n[a])) {
      return false;
    }
  }
  return true;
};

var TemplateSchema = mongoose.Schema({
  creatorId: {type:ObjectId, index:true, validate:isObjectId},
  name: {type:String, index:true, required:true},
  imageId: {type:ObjectId, required:true, validate:isObjectId}
});
exports.Template = mongoose.model("Template",TemplateSchema);

var ImageSchema = mongoose.Schema({
  data: {type:Buffer, required:true},
  mime: {type:String, required:true},
  firstFrameData: {type:Buffer}
});
exports.Image = mongoose.model("Image",ImageSchema);

var MemeSchema = new mongoose.Schema({
  creatorId: {type:ObjectId, index:true, required:true, validate:isObjectId},
  templateId: {type:ObjectId, index:true, required:true, validate:isObjectId},
  messages: [{
    valign: {type:String, required:true, validate:function(valign) {
      return valign == 'top' || valign == 'center' || valign == 'bottom';
    }},
    halign: {type:String, required:true, validate:function(halign) {
      return halign == 'left' || halign == 'center' || halign == 'right';
    }},
    content: {type:String, index:true}
  }],
  chatlog: [{
    creatorId: {type:ObjectId, index:true, validate:isObjectId, required:true},
    timestamp: {type: Date, default: Date.now, index:true, required:true},
    content: {type:String, index:true, required:true}
  }],
  votes: {type:[ObjectId], index:true, validate:isObjectIdArray},
  downvotes: {type:[ObjectId], default:[], index:true, validate:isObjectIdArray},
  numVotes: {type:Number, index:true, required:true},
  context: {type:String, index:true},
  creationTime: {type: Date, default: Date.now, index:true}
});
var Meme = exports.Meme = mongoose.model("Meme",MemeSchema);

var UserSchema = mongoose.Schema({
  username: {type:String, index:true, unique:true, required:true},
  fullName: {type:String, index:true},
  email: {type:String, index:true, required:true},
  groups: {type:[ObjectId], default: [], validate:isObjectIdArray},
  lastLoginTime: {type:Date, default:null},
  fromLdap: {type:Boolean, required:true},
  watchedPageIds: {type:[ObjectId], default:[]}
});
exports.User = mongoose.model("User",UserSchema);

var UserPasswordSchema = mongoose.Schema({
  userId: {type: ObjectId, required:true, index:true, validate:isObjectId},
  password: { type: String, required:true }
});
exports.UserPassword = mongoose.model("UserPassword",UserPasswordSchema);

var GroupSchema = mongoose.Schema({
  name: {type:String, index:true, unique:true, required:true},
  fromLdap: {type:Boolean, required:true}
});
exports.Group = mongoose.model("Group",GroupSchema);

var AngularErrorSchema = mongoose.Schema({
  message: String,
  stack: String,
  location: Mixed,
  cause: String,
  performance: Mixed,
  context: Mixed
});
exports.AngularError = mongoose.model("AngularError",AngularErrorSchema);

var saveAllDocuments = exports.saveAllDocuments = function(documents, callback) {
  if (documents.length==0) {
    callback();
    return;
  }
  var onDocument = 0;
  var iterate = function(err, product, numberAffected) {
    onDocument++;
    if (documents.length>onDocument) {
      documents[onDocument].save(iterate);
    } else {
      callback();
    }
  };
  documents[onDocument].save(iterate);
};

// Sanitize the database.
exports.sanitize = function() {
};
