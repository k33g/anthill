const http = require('http')
const port = process.env.PORT || 8080

const mosca = require('mosca')
const amqp = require('amqplib')

let moscaSettings = {
  port: parseInt(process.env.MQTT_PORT) || 5008
}

let server = new mosca.Server(moscaSettings)


function setup () {
  console.log('Mosca listening on ' + moscaSettings.port);
  /*
  var connectionP = amqp.connect(process.env.RABBIT_URI);
  connectionP.then(consumeRabbitEventQueue);
  connectionP.catch(function(e) { console.error(e); });
  */

}
/*
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

function sendMessage(payload) {
  server.publish({
    topic: process.env.MQTT_TOPIC,
    payload: payload,
    qos: 0,
    retain: false
  }, function() {  });
};
*/

server.on('clientConnected', function(client) {
  console.log('client connected', client.id);
});

// fired when a message is received
server.on('published', function(packet, client) {
  console.log('Published', packet.payload);
});

server.on('ready', setup);


// http part
const requestHandler = (request, response) => {
  console.log(request.url)
  response.end('Hello Node.js Server!')
}

const httpServer = http.createServer(requestHandler)

httpServer.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})