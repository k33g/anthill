const http = require('http')
const port = process.env.PORT || 8080

const mosca = require('mosca')
const amqp = require('amqplib')

let server = new mosca.Server({
  port: process.env.MQTT_PORT || 5008
})

function sendMessage(payload) {
  server.publish({
    topic: process.env.MQTT_TOPIC,
    payload: payload,
    qos: 0,
    retain: false
  }, function() {  });
};



function handleMessage(message) {
  var evt = JSON.parse(message.content);
  var payload = evt.event;
  if(payload != "CLEVER_TOOLS_REQUEST") {
    sendMessage(payload);
  }
};


function consumeRabbitEventQueue(connection) {
  console.log("Connected to RabbitMQ.");
  connection.createChannel().then(function(channel) {
    var queue = process.env.RABBIT_QUEUE;
    channel.assertQueue(queue, {durable: false}).then(function() {
      channel.consume(queue, handleMessage, {noAck: true});
    });
  });
};


function setup () {
  console.log('Mosca listening on ' + moscaSettings.port);
  server.authenticate = function(client, user, pwd, cb) {
    if(typeof user != 'null' && typeof pwd != 'null') {
      if(user === process.env.AUTH_USER && pwd.toString() == process.env.AUTH_PASSWORD) {
        client.user = user;
        cb(null, true);
      }
    }
  }
  
  var connectionP = amqp.connect(process.env.RABBIT_URI);
  connectionP.then(consumeRabbitEventQueue);
  connectionP.catch(function(e) { console.error(e); });

  //generateDummyEvents();

}

server.on('ready', setup);
server.on('clientConnected', function(client) { console.log('client connected: ' + client.id); });
server.on('clientDisconnecting', function(client) { console.log('client disconnecting:' + client.id); });
server.on('clientDisconnected', function(client) { console.log('client disconnected:' + client.id); });
server.on('subscribed', function(topic, client) { console.log('client ' + client.id + ' subscribed to topic ' + topic); });
server.on('unsubscribed', function(topic, client) { console.log('client ' + client.id + ' unsubscribed from topic ' + topic); });

server.on('published', function(packet, client) {
  var clientName;
  if(client === null || typeof client == "undefined") {
    clientName = 'an unknown client';
  } else {
    clientName = 'client ' + client.id;
  }
  console.log(
    'Sent message to ' + clientName +
    ' on topic ' + packet.topic + ': ' +
    packet.payload + ' (messageId: ' + packet.messageId + ')'
  );
});



// http part
const requestHandler = (request, response) => {
  console.log(request.url)
  response.end('Hello Node.js Server!')
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})