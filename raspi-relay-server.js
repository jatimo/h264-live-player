"use strict";

const http               = require('http');
const express            = require('express');
const RemoteTCPFeedRelay = require('./lib/remotetcpfeed');
const app                = express();


//public website
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/vendor/dist'));

var options = JSON.parse(require('fs').readFileSync(__dirname + "/service-settings.json", 'utf8'));
const util = require('util');
const server  = http.createServer(app);
const feed    = new RemoteTCPFeedRelay(server, options);

// reference for use in stream statistics.
app.server = feed;

// a simple dynamic routing using the demo html landing page.
// js client will be responsible for taking URL and sending a ws request with stream name at connect time.
app.get('/view/*',function(req, res){
  res.sendfile('./public/index.html')
});
app.get('/streams', function(req,res,next){
  var output = "<h4>Feeds</h4><ul>\n";
  if (app.server.wss.clients.length == 0) {
    output += "</ul>\n";
  }
  if (app.server.wss.clients.length != 0 ) {
    app.server.wss.clients.forEach(function(client) {
      if (client.feeder) {
        output += "\t<li><a href='/view/" + client.stream_name + "'>"+ client.stream_name + "</a></li>\n";
      }
    });
  }
  output += "</ul>\n";
  res.send(output);
});



console.log(`Listening on port ${options.server_port}.`)

server.listen(options.server_port);






