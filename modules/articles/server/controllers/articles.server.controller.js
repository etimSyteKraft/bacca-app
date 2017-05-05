'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  _ = require('lodash'),
  mongoose = require('mongoose'),
  cloudinary = require('cloudinary'),
  Article = mongoose.model('Article'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a article
 */
exports.create = function (req, res) {
  var article = new Article(req.body);
  article.user = req.user;

  article.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article);
    }
  });
};

/**
 * Show the current article
 */
exports.read = function (req, res) {
  res.json(req.article);
};

/**
 * Update a article
 */
exports.update = function (req, res) {
  var article = req.article;

  article.title = req.body.title;
  article.intro = req.body.intro;
  article.content = req.body.content;
  article.tags = req.body.tags;

  article.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article);
    }
  });
};

/**
 * Delete an article
 */
exports.delete = function (req, res) {
  var article = req.article;

  article.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article);
    }
  });
};

/*
*Add a comment to a post
*/
exports.addComment = function(req, res){
  var article = req.article;
  //console.log('article', req.article);
  //console.log('body', req.body);
  article.comments.push(req.body);//should be replaced by req.body in prod and proper test
  _.last(article.comments).user = req.user;

  article.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article);
    }
  });
};

/**
 * Delete a comment
 */
exports.deleteComment = function (req, res) {
  var article = req.article;
  var comments = article.comments;

  for(var i in comments){
    var comment = comments[i];
    var commentIdString = comment._id ? comment._id.toString() : null;
    if (commentIdString !== null) {
      console.log('comment exists!');
      if (commentIdString === req.params.commentId) {
        comments.splice(i);
        break;
      }
    }
  }

  article.comments = comments;

  article.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article);
    }
  });
};

/**
 * update a comment
 */

exports.updateComment = function (req, res) {
  var article = req.article;

  for(var i in article.comments){
    var comment = article.comments[i]._id.toString();

    console.log(comment, ' : ', req.params.commentId);

    if (comment === req.params.commentId) {
      article.comments[i].content = req.body.content;
      article.comments[i].created = Date.now();
      break;
    }
  }
  
  article.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article);//it could return only the comments
    }
  });
};

/**
 * moderate a comment by blocking it
 */

exports.blockComment = function (req, res) {
  var article = req.article;
  for(var i in article.comments){
    var comment = article.comments[i]._id.toString();

    if (comment === req.params.commentId) {
      article.comments[i].blocked = true;
      break;
    }
  }

  article.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article); //it could return only the comments
    }
  });
};

/**
 * moderate a comment by unblocking it
 */

exports.unblockComment = function (req, res) {
  var article = req.article;
  for(var i in article.comments){
    var comment = article.comments[i]._id.toString();

    if (comment === req.params.commentId) {
      article.comments[i].blocked = false;
      break;
    }
  }

  article.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article); //it could return only the comments
    }
  });
};

/**
 * Add comment reply
 */

exports.addCommentReply = function(req, res){
  var article = req.article;

  for(var i in article.comments){
    
    var comment = article.comments[i]._id.toString();

    if(comment !== req.params.commentId.toString()) {
      continue;
    } else {
      //should be replaced by req.body in production
      article.comments[i].replies.push(req.body);

      //add reply owner for referencing parent comment
      _.last(article.comments[i].replies).user = req.user;
      _.last(article.comments[i].replies).parent = req.params.commentId;
    }
    break;
  }

  article.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article);//it could return only the replies
     
    }
  });
};


/**
* Delete reply to comment
*/

exports.deleteCommentReply = function (req, res) {
  var article = req.article;
  for(var i in article.comments){
    if(article.comments[i]._id.toString() === req.params.commentId){
      for(var j in article.comments[i].reply){
        if(article.comments[i].reply[j]._id.toString() === req.params.replyId){
          _.pullAt(article.comments[i].reply, j);
          break;
        }        
      }
      break;  
    }
  }

  article.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article);
    }
  });
};


/**
 * update reply to a comment
 */
exports.updateCommentReply = function (req, res) {
  var article = req.article;
  for(var i in article.comments){
    if(article.comments[i]._id.toString() === req.params.commentId){
      for(var j in article.comments[i].reply){
        if(article.comments[i].reply[j]._id.toString() === req.params.replyId){
          article.comments[i].reply[j].content = req.body.content;
          //update creation time
          article.comments[i].reply[j].created = Date.now();
          break;
        }        
      }
      break;  
    }
  }

  article.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article);
    }
  });
};

/**
Text search article topics and content
*/

exports.textSearch = function(req, res){
  Article.find({ $text: { $search: req.params.searchText } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).exec(function(err, article){
    if(err){
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(article);
    }
  });
};


/**
list of articles by tags
*/
exports.listArticlesByTags = function(req, res){
  Article.find({ 'tags.text': req.params.tag }).sort('-created').exec(function(err, articles){
    if(err){
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(articles);
    }
  });
};

/**
get all tags and counts of distinct tags
*/
exports.listTags = function (req, res){
  //responds with array of objects containing the tag and number of articles containing the tags
  Article.aggregate(
  [{ '$unwind': '$tags' }, { '$group': { '_id': '$tags.text', 'count': { $sum: 1 } } }]).exec(function(err, tags){
    if(err){
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(tags);
    }
  });
};



/**
 * List of Articles
 */
exports.list = function (req, res) {
  Article.find().sort('-created').populate('user', 'displayName').exec(function (err, articles) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(articles);
    }
  });
};

/**
 * Article middleware
 */
exports.articleByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Article is invalid'
    });
  }

  Article.findById(id).populate('user', 'displayName profileImageURL')
    //this works for only two level nesting
    .populate('comments.user', 'displayName profileImageURL')
    .populate({ path: 'comments.replies.user', model: 'User', select: 'displayName profileImageURL' })
    .exec(function (err, article) {
      if (err) {
        return next(err);
      } else if (!article) {
        return res.status(404).send({
          message: 'No article with that identifier has been found'
        });
      }
      req.article = article;
      next();
    });
};

//compare user id to comments user id
exports.verifyComment = function(req, res, next){
  //console.log(req.article.comments);
  var commentId = req.params.commentId.toString();
  for(var i in req.article.comments){
    //console.log(i);
    //console.log('comment - ', commentId, req.article.comments[i]._id.toString());
    if (commentId === req.article.comments[i]._id) {
      if (req.user._id.toString() === req.article.comments[i].user._id.toString()){
        req.commentPosition = i;
        req.commentGo = true;
        req.comment = req.article.comments[i];
      }
    }
    break;
  }
  next();
};

exports.verifyReply = function(req, res, next){
  for(var i in req.article.comments){
    if(req.params.commentId.toString() === req.article.comments[i]._id.toString()){
      for(var j in req.article.comments[i].reply){
        var replyId = req.params.replyId;
        if (replyId === req.article.comments[i].reply[j]._id.toString()) {
          if (req.user.id === req.article.comments[i].reply[j].user._id.toString()){
            req.replyPosition = j;
            req.replyGo = true;
            req.reply = req.article.comments[i].reply[j];                       
          }
          break;
        }
      }
      break; 
    }
    
   
  }
  next();
};
