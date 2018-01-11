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
    if(typeof user != 'null' && typeof pwd != 'null') {
      if(user === process.env.AUTH_USER && pwd.toString() == process.env.AUTH_PASSWORD) {
        console.log(`😃 client authenticated`)
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

  if(packet.cmd=="publish") {

    let displayInformations = (client, packet, data) => {

      let clientName = client === null || typeof client == "undefined" 
        ? 'an unknown client' 
        : `client ${client.id}`

      console.log(`==[START]=======================================================`)
      console.log(` 💌 to:`, clientName, `topic:`, packet.topic);
      console.log(` ℹ️ messageId:`, packet.messageId)
      console.log(` 📝 content:`, packet.payload)
      console.log(`==[END]=========================================================`)
    }

    try {
      let data = JSON.parse(packet.payload.toString().replace(/\0/g,""))
      displayInformations(client, packet, data)
    } catch (error) {
      let data = packet.payload
      displayInformations(client, packet, data)
      
    }
  }


});

const httpServer = express()
httpServer.use(bodyParser.json());
httpServer.use(bodyParser.urlencoded({extended: false}));
httpServer.use(express.static('public'));

httpServer.get('/', (request, response) => {
  response.send('Hello.')
})

// http://anthill.cleverapps.io/send/mqtt/topic/<topic_name>/message/<message_value>
httpServer.get('/send/mqtt/topic/:topic/message/:value', (request, response) => {
  
  let topic = request.params["topic"] ? request.params["topic"] : "no-topic"
  let message = request.params["value"] ? request.params["value"] : "no-value"

  let mqttMessage = {
    topic: topic,
    payload: JSON.stringify({message: value}), // or a Buffer
    qos: 0, // 0, 1, or 2
    retain: false // or true
  };

  mqttBroker.publish(mqttMessage, ()=> {
    // foo
  });

})

httpServer.listen(process.env.PORT, () => {
  console.log(`🌍 listening on ${process.env.PORT}`)
})
