var mosca = require('mosca');
var amqp = require('amqplib');
var express = require('express');
var Rx = require('rxjs');

var moscaSettings = {
  port: parseInt(process.env.MQTT_PORT)
};

var server = new mosca.Server(moscaSettings);

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

function setup() {
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

  generateDummyEvents();
}

function consumeRabbitEventQueue(connection) {
  console.log("Connected to RabbitMQ.");
  connection.createChannel().then(function(channel) {
    var queue = process.env.RABBIT_QUEUE;
    channel.assertQueue(queue, {durable: false}).then(function() {
      channel.consume(queue, handleMessage, {noAck: true});
    });
  });
};

function handleMessage(message) {
  var evt = JSON.parse(message.content);
  var payload = evt.event;
  if(payload != "CLEVER_TOOLS_REQUEST") {
    sendMessage(payload);
  }
};

function generateDummyEvents() {
  function randomDelay(bottom, top) {
    var x = Math.floor(Math.random() * (top - bottom)) + bottom;
    return x;
  }

  var source = Rx.Observable
    .of("")
    .switchMap(function(x) {
      return Rx.Observable
        .of("")
        .delay(randomDelay(
          parseInt(process.env.DUMMY_EVENT_MIN_DELAY),
          parseInt(process.env.DUMMY_EVENT_MAX_DELAY)
        ));
    })
    .repeat();

  source.subscribe(function(x) {
    sendMessage("DUMMY_EVENT");
  });
};

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
