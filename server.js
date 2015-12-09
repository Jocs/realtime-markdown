var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var express = require('express');

app.use(express.static(__dirname + '/src'));
server.listen(8080, function(){
	console.log('server at 8080');
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/src/index.html');
});

io.on('connection', function (socket) {
  //socket.emit('news', { hello: 'world' });
  socket.on('uploadImage', function (data) {
  	if(!/^image\/(png|jpeg)$/.test(data.type)) return;
  	var name = data.name.split(/\.(?=png|jpg)/);
  	var path = './src/uploadImage/';
    var title = name[0];
  	name = (+new Date()) +'.'+ name[1];
    fs.writeFile(path + name, data.file, function(err, data){
    	if(err) socket.emit('resImageUpload', {error: '图片储存失败'});
      else {
        var data = {
          title: title,
          path: './uploadImage/' + name
        };
        console.log(data);
        socket.emit('resImageUpload', data);
      }
    })
  });
  socket.on('uploadArticle', function(data){
    fs.writeFile('./uploadArticle/index.html', data.html, function(err){
      if(err) console.log(err);
      else {
        socket.emit('ArticleRes', data);
      }
    });
  });







});