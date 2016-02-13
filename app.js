var express = require('express')
  , main = require('./routes/main.js')
  , http = require('http')
  , path = require('path')

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 31313);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hjs');
  //app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  //app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(require('less-middleware')(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, '/web')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
  res.sendfile('web/launchpage.html');
});
app.get('/realindex', function(req, res) {
  res.sendfile('web/index.html');
});
app.get('/signup', main.signup);
app.get('/send', main.request_interview);
app.get('/accept', main.request_updated);
app.get('/creepyInfo', main.creepyInfo);
app.get('/candidateEmail', main.candidateEmail);
app.get('/subscribe', main.subscribe);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
