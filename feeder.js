const md5 = require('md5');
const WebSocket = require('ws');
var options = JSON.parse(require('fs').readFileSync(__dirname + "/service-settings.json", 'utf8'));
var uri = "ws://" + options.server_ip + ":" + options.server_port

console.log(uri);
console.log("Stream name: " + options.stream_name);
const ws = new WebSocket(uri);
const child_process = require('child_process');
  
    var streamer = child_process.spawn('raspivid', ["-ih", "--intra", options.intra, "-t","0","-pf","baseline","-h",options.height,"-w",options.width,"-o", "-", "-fps", options.fps, "-fl"]);
    streamer.on("exit", function(code){
      console.log("Failure", code);
    });
  
ws.on('open', function open() {
    console.log("Connected.");
    key = md5(options.private_key + options.stream_name);
    console.log("crypto hash: " + key);
    ws.send("FEEDSTREAM foo " + key);
    streamer.stdout.on("data", function(data){
      try {
        ws.send(data);
      } catch(error) {
        console.log("Connection lost. Maybe crypto key was bad?");
        process.exit();
      }
    });     
});
