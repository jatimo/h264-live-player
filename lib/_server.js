"use strict";
const util = require('util');

const WebSocketServer = require('ws').Server;
const Splitter        = require('stream-split');
const merge           = require('mout/object/merge');
const md5 = require('md5');
const NALseparator    = new Buffer([0,0,0,1]);//NAL break


class _Server {

  constructor(server, options) {

    this.options = merge({
        width : 960,
        height: 540,
    }, options);

    this.wss = new WebSocketServer({ server });

    this.new_client = this.new_client.bind(this);
    this.start_feed = this.start_feed.bind(this);
    this.broadcast  = this.broadcast.bind(this);

    this.wss.on('connection', this.new_client);
  }
  

  start_feed(stream_name, stream_key) {
      
    
    
  }

  get_feed() {
    throw new Error("to be implemented");
  }

  broadcast(feeder_socket, data) {
    this.wss.clients.forEach(function(socket) {
        //console.log("%s %s", feeder_socket.stream_name, socket.stream_name)
        if (socket.feeder != true && feeder_socket.stream_name != socket.stream_name) {
          return;
        }
        if(socket.buzy)
          return;

        socket.buzy = true;
        socket.buzy = false;
        try {
        socket.send(Buffer.concat([NALseparator, data]), { binary: true}, function ack(error) {
          //console.log("bcast");
          socket.buzy = false;
        });
        } catch (error) {
          
        }
      
    });
  }
  
  crypto_match(stream_name, stream_key) {
    var local_hash = md5(this.options.private_key + stream_name);
    console.log("LOCAL : " + local_hash);
    console.log("REMOTE: " + stream_key);
    if (local_hash == stream_key) {
      return true;
    } else {
      return false;
    }
   
  }
  
  new_client(socket) {
  
    var self = this;
    console.log('New connection: ' + socket.remoteAddress);

    socket.send(JSON.stringify({
      action : "init",
      width  : this.options.width,
      height : this.options.height,
    }));
    socket.feeder = false;
    socket.on("message", function(data){
      try {
        var cmd = "" + data, action = data.split(' ')[0], stream_name = data.split(" ")[1], stream_key = data.split(" ")[2];

        if ((action == "FEEDSTREAM") && (self.crypto_match(stream_name, stream_key))) {
          console.log("Crypto Match. Receiving Feed for %s", stream_name);
          socket.stream_name = stream_name;
          socket.feeder = true;
        
        } else if ( action == "GET" ) {
            stream_name = stream_name.slice(6); //remove leading slash
            console.log("client request for stream %s", stream_name);
            socket.stream_name = stream_name;
            socket.feeder = false;
        } else {
          console.log("bad key for %s", stream_name);
          socket.close();
        }
      } catch (error)  { // in this case the data received over ws was not a command message but video data, so relay it.
        self.broadcast(socket, data);
      }

    });

    socket.on('close', function() {

      console.log('stopping client interval');
    });
  }


};


module.exports = _Server;
