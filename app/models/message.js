'use strict';

var async = require('async'),
    Mongo = require('mongodb');

function Message(senderId, receiverId, message){
  this.senderId = senderId;
  this.receiverId = receiverId;
  this.message = message.body;
  this.date = new Date();
  this.isRead = false;

}

Object.defineProperty(Message, 'collection',{
  get: function(){return global.mongodb.collection('messages');}
});

Message.read = function(id, cb){
  var _id = Mongo.ObjectID(id);
  Message.collection.findAndModify({_id:_id}, [], {$set:{isRead:true}}, function(err, msg){
    iterator(msg, cb);
  });
};

Message.send = function(senderId, receiverId, message, cb){
  var m = new Message(senderId, receiverId, message);
  Message.collection.save(m, cb);
};

Message.find = function(filter, cb){
  Message.collection.find(filter).toArray(cb);
};

Message.prototype.save = function(cb){
  Message.collection.save(this, cb);
};

Message.undread = function(receiverId, cb){
  receiverId = Mongo.ObjectID(receiverId);
  Message.collection.find({receiverId:receiverId}).count(cb);
};

Message.messages = function(receiverId, cb){
  receiverId = Mongo.ObjectID(receiverId);
  Message.collection.find({receiverId:receiverId}).sort({date: -1}).toArray(function(err,msgs){
    async.map(msgs, iterator, cb);
  });
};

module.exports = Message;

function iterator(msg, cb){
  require('./user').findById(msg.senderId, function(err, sender){
    msg.sender = sender;
    cb(null, msg);
  });
}
