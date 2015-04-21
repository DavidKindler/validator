var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var urlParser = require("url");
var cookieParser = require("cookie-parser");
var expressHbs = require('express-handlebars');
var myValidator = require('./validator.js')

app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'main.hbs'}));

app.set('port', process.env.PORT || 3000);
app.set('view engine','hbs')

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use("/css",express.static(__dirname + "/css"));
app.use("/img",express.static(__dirname + "/img"));
app.use(cookieParser());
app.use(function(err,req,res,next){
  res.status(err.status || 404);
  res.send(err.message);
});

var regex = "^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*\:)*?:?0*1$";
var  regexObj = new RegExp(regex);


app.get('/',function(req,res){
 if (typeof(req.query.url) !== 'undefined' && req.query.url.length > 0 )  {
     var urlParsed = urlParser.parse(req.query.url);
    if(urlParsed.protocol == null || regexObj.test(urlParsed['hostname']) ) {
      var data = {'invalid': true, 'url' : 'NOT ALLOWED'}
       res.render('index',data)
    } 
    else
    {
      var data = {'valid': true, 'url': req.query.url, 'out': {} }
      var out = myValidator.lintURL(req.query.url, function(result){
	      data.pretty = JSON.stringify(result,null,"\t") 
	      data.out = result;
	      res.render('index', {
		        data : data,
		        helpers: {
		            line : function(i) {return data.out.lines[i-1];},
		            htmlErrors : function(){
		            	var count =0;
		            	for(var i=0; i<data.out.html.messages.length; i++){
                        if (data.out.html.messages[i].type  == "error"){
                        	count++;
                        }
		            	} 
		            	return count;
		            },
		            htmlWarnings : function(){
		            	var count =0;
		            	for(var i=0; i<data.out.html.messages.length; i++){
                        if (data.out.html.messages[i].type  == "info"){
                        	count++;
                        }
		            	} 
		            	return count;
		            },
		            typeClass: function(type){
		            	if (type === "error") {return "typeError"}
		            		else {return "typeWarning"}
		            }
		        }
		    });
	   });
    }
  } else {
    var data = {'url': null}
     res.render('index',data)
  }  
    
})

app.route('/about').get(function(req, res, next) {
  // res.send('about page');
  res.render('about');
  // next(err);
});
 
app.route('/contact').get(function(req, res, next) {
  res.render('contact');
  // next(err);
});

app.get('*', function(req, res, next) {
  var err = new Error();
  err.status = 404;
  next(err);
});
 

app.use(function(err, req, res, next) {
  if(err.status !== 404) {
    return next(err);
  }
  res.render("404");
});

var server = app.listen(app.get('port'), function() {
  console.log ('Express server listening on port ' + server.address().port);
});

