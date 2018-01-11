# anthill

## Clever Cloud side

### Environment variables

```
AUTH_PASSWORD=your_password
AUTH_USER=your_user_name
MQTT_PORT=4040
PORT=8080
```

## Play with it

```
npm init -y
# see https://github.com/mqttjs/MQTT.js
npm install mqtt -s 
```

**index.js**

```javascript
const mqtt = require('mqtt')

let exposedMqttPort = process.env.EXPOSED_MQTT_PORT

let client1  = mqtt.connect(`mqtt://domain.par.clever-cloud.com:${exposedMqttPort}`, {
  clientId: "client1",
  username: "john",
  password: "doe"
})

let client2  = mqtt.connect(`mqtt://domain.par.clever-cloud.com:${exposedMqttPort}`, {
  clientId: "client2",
  username: "john",
  password: "doe"
})

// no client id
let client3  = mqtt.connect(`mqtt://domain.par.clever-cloud.com:${exposedMqttPort}`, {
  username: "john",
  password: "doe"
})

// don't use arrow notation for the callback
client1.on('connect', function() {
  console.log(`${client1.options.clientId} connected`)
})

client2.on('connect', function() {
  console.log(`${client2.options.clientId} connected`)
  client2.subscribe('hello')
})

client3.on('connect', function() {
  console.log(`${client3.options.clientId} connected`)
})

client2.on('message', function(topic, message) {
  console.log("💌", message.toString(), "on", topic)
})

client1.publish('hello', JSON.stringify({message:"Hello people!"}))
client1.publish('hello', "👋 🌍")
client3.publish('hello', "I'm John Doe")

/**
 * try http://anthill.cleverapps.io/send/mqtt/topic/hello/message/hello-world
 * to send hello-world message to client2 on hello topic
 */
```