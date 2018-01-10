const mosca = require('mosca')
const express = require('express')

let moscaSettings = {
  port: parseInt(process.env.MQTT_PORT)
}

let server = new mosca.Server(moscaSettings);

server.on('ready', () => {
  console.log(`👋 Mosca listening on ${moscaSettings.port}`)

  // TODO: refactor
  server.authenticate = (client, user, pwd, cb) => {
    if(typeof user != 'null' && typeof pwd != 'null') {
      if(user === process.env.AUTH_USER && pwd.toString() == process.env.AUTH_PASSWORD) {
        client.user = user;
        cb(null, true);
      }
    }
  }
})

server.on('clientConnected', (client) => { 
  console.log(`client connected: ${client.id}`)
})
server.on('clientDisconnecting', (client) => { 
  console.log(`client disconnecting: ${client.id}`)
})
server.on('clientDisconnected', (client) => { 
  console.log(`client disconnected: ${client.id}`)
})
server.on('subscribed', (topic, client) => { 
  console.log(`client ${client.id} subscribed to topic ${topic}`) 
})
server.on('unsubscribed', (topic, client) => { 
  console.log(`client ${client.id} unsubscribed from topic ${topic}`) 
})
server.on('published', (packet, client) => {
  let clientName = client === null || typeof client == "undefined" 
    ? 'an unknown client' 
    : `client ${client.id}`
  
  console.log(`==[START]=======================================================`)
  console.log(` 💌 to:`, clientName, `topic:`, packet.topic);
  console.log(` ℹ️ messageId:`, packet.messageId)
  console.log(` 📝 content:`, packet.payload)
  console.log(`==[END]=========================================================`)

});

// TODO: refactor
function sendMessage(payload) {
  server.publish({
    topic: process.env.MQTT_TOPIC,
    payload: payload,
    qos: 0,
    retain: false
  }, function() {  });
};

var httpServer = express();

httpServer.get('/', function(request, response) {
  response.send('Hello.');
});

httpServer.get('/sendMessage', function(request, response) {
  var p = request.query.payload;
  if(p !== null && typeof p != "undefined") {
    sendMessage(request.query.payload);
    response.send('Sent.');
  } else {
    response.send('You need to add a query parameter named payload');
  }
});

httpServer.listen(process.env.PORT, function() {
  console.log('HTTP listening on ' + process.env.PORT);
});
