/**
 * MQTT Broker - Demo for Clever Cloud
 */

const mosca = require('mosca')
const express = require('express')
const bodyParser = require("body-parser");

let moscaSettings = {
  port: parseInt(process.env.MQTT_PORT)
}

let mqttBroker = new mosca.Server(moscaSettings);

mqttBroker.on('ready', () => {
  console.log(`👋 Mosca listening on ${moscaSettings.port}`)

  // TODO: refactor
  mqttBroker.authenticate = (client, user, pwd, cb) => {
    if(user && pwd) {
      if(user === process.env.AUTH_USER && pwd.toString() == process.env.AUTH_PASSWORD) {
        console.log(`😃 ${client.id} authenticated`)
        client.user = user;
        cb(null, true);
      }
    }
  }
})

mqttBroker.on('clientConnected', (client) => { 
  console.log(`client connected: ${client.id}`)
})
mqttBroker.on('clientDisconnecting', (client) => { 
  console.log(`client disconnecting: ${client.id}`)
})
mqttBroker.on('clientDisconnected', (client) => { 
  console.log(`client disconnected: ${client.id}`)
})
mqttBroker.on('subscribed', (topic, client) => { 
  console.log(`client ${client.id} subscribed to topic ${topic}`) 
})
mqttBroker.on('unsubscribed', (topic, client) => { 
  console.log(`client ${client.id} unsubscribed from topic ${topic}`) 
})
mqttBroker.on('published', (packet, client) => {

  if(packet.payload instanceof Buffer) {

    let displayInformations = (client, packet, data) => {
      // client.id is never null or undefined, Mosca set a default random id if no id
      console.log(`==[START]=======================================================`)
      console.log(` 💌 from:`, client.id, `topic:`, packet.topic);
      console.log(` ℹ️ messageId:`, packet.messageId)
      console.log(` 📝 content:`, data)
      console.log(`==[END]=========================================================`)
    }

    try {
      let data = JSON.parse(packet.payload.toString('utf8'))
      console.log("😍", "json data")
      displayInformations(client, packet, data)
    } catch (error) {
      console.log("😡", "txt data")
      let data = packet.payload.toString('utf8')
      displayInformations(client, packet, data)
    }
  }


});

const httpServer = express()
httpServer.use(bodyParser.json());
httpServer.use(bodyParser.urlencoded({extended: false}));
httpServer.use(express.static('public'));


// http://anthill.cleverapps.io/send/mqtt/topic/<topic_name>/message/<message_value>
// http://anthill.cleverapps.io/send/mqtt/topic/hello/message/hello-world
httpServer.get('/send/mqtt/topic/:topic/message/:value', (request, response) => {
  
  let topic = request.params["topic"] ? request.params["topic"] : "no-topic"
  let value = request.params["value"] ? request.params["value"] : "no-value"

  let mqttMessage = {
    topic: topic,
    payload: JSON.stringify({message: value}), // or a Buffer
    qos: 0, // 0, 1, or 2
    retain: false // or true
  };

  mqttBroker.publish(mqttMessage, function() {
    // foo
  });
  response.send('Hello.')

})

httpServer.listen(process.env.PORT, () => {
  console.log(`🌍 listening on ${process.env.PORT}`)
})
