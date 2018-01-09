"use strict";

const http               = require('http');
const express            = require('express');
const RemoteTCPFeedRelay = require('./lib/remotetcpfeed');
const app                = express();


//public website
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/vendor/dist'));

var options = JSON.parse(require('fs').readFileSync(__dirname + "/service-settings.json", 'utf8'));



const server  = http.createServer(app);
const feed    = new RemoteTCPFeedRelay(server, options);

var raspivid_cmd = `raspivid -t 0 -ih --profile baseline --intra ${options.intra}  -w ${options.width} -h ${options.height} -fps ${options.fps} -o - `;
var netcat_cmd = ` nc -k -l ${options.feed_port}`;
var raspi_cmd = raspivid_cmd + " | " + netcat_cmd;

app.get('/raspivid_cmd', function (req, res) {
  var remote_cmd = "#!/usr/bin/env bash \n";
  remote_cmd += `echo  Running: "${raspi_cmd}" \n`;
  remote_cmd += "echo Press Ctrl-C to exit.\n"
  remote_cmd += raspi_cmd + "\n";
  res.send(remote_cmd);
});

console.log("On the remote raspi run:");
console.log("#! " + raspi_cmd + "\n\n");
console.log("OR if you are not philosophically opposed to shell pipes, this always agrees with server settings:");
console.log(`#! curl -s http://${options.server_ip}:${options.server_port}/raspivid_cmd | bash` + "\n\n");
console.log(`Listening on port ${options.server_port}.`)

server.listen(options.server_port);






