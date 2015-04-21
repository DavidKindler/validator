var request = require('request');
var tmp = require('tmp');
var fs =require('fs');
var html5Lint = require( 'html5-lint' );
var async = require('async');

tmp.setGracefulCleanup();

function errorHandler(err){
	console.log ('ERROR: ',err);
}

function iterator(url,end){
  var out = {};
  var hasHTML = true;
  async.waterfall([
     function(callback){
         if (url.slice(-2) == 'js') { 
             hasHTML = false;
         }
         callback(null, url);
         console.log ('URL: ', url);
      },
      function(url,callback){
       request({uri: url}, function(err, response, html){ 
         callback(null,html);
       }); 
      },
      function(html,callback){
             tmp.file(function _tmpFileCreated(err,path,fd){
                if (err) return errorHandler(err);
                fs.writeFile(path, html, function(err){
                  if (err) return errorHandler(err);
                   callback(null,path,html);
                })
              });
                
      },
      function(file,html,callback){
         console.log("File: ", file);
          var exec = require('child_process').exec;
          var jsStr = 'jshint --extract=auto --reporter=myreporter.js '+file;
           var child = exec(jsStr);
           child.stdout.on ('data',function(data){
            data = eval(data);
            out['js']=data;
            out['lines']=html.split(/\r?\n/);
           callback(null,html);
           })
           child.stderr.on('data',function(data){
            console.log ('stderr: ',data);
           })
           child.on('close',function(code){
            console.log ('closing jshint: ',code);
         
            fs.unlink(file, function(err){
              if (err) return errorHandler(err);
              console.log ('unlinked ',file);
            })          

           })
      },
      function(html, callback){
        if (hasHTML) {
          html5Lint( html, function( err, results ) {
            out['html']=results;
            callback(null, out);
          }); 
       } else {
          callback(null, out);
       }
      }
  ], function (err, result) {
     // console.log ("RESULT",result);
     end(result);
  });
}

module.exports.lintURL = iterator;
