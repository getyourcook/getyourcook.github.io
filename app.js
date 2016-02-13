var express = require('express')
  , main = require('./routes/main.js')
  , http = require('http')
  , path = require('path')

var app = express();

app.set('port', process.env.PORT || 31313);
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');
//app.use(express.favicon());
//app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, '/web')));

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
