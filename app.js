let WebSocketServer = require('ws').Server
let express = require('express')
let path = require('path')
let app = express()
let DataGenerator = require('./utils/dataGenerator')
let server = require('http').createServer()

app.use(express.static(path.join(__dirname, '/public')))

let wss = new WebSocketServer({server: server, path: '/websocket'})
wss.on('connection', function (ws, req) {
  ws.on('close', function () {
    console.log('stopping client interval')
  })

  ws.on('error', function () {
    console.log('connection aborted')
  })

  ws.on('message', function (msg) {
    msg = JSON.parse(msg)
    if (msg.event === 'subscribe') {
      if (!ws.__generator) {
        let start = new Date(2019, 0, 1).getTime()
        ws.__generator = new DataGenerator(start, msg.interval)
      }
      ws[`__${msg.channel}`] = true
    } else {
      ws[`__${msg.channel}`] = false
    }
  })
})

// 模拟分时图
setInterval(function () {
  wss.clients.forEach(function (ws) {
    if (ws.readyState !== 1) {
      console.log('Client has been terminated')
      return
    }

    let generator = ws.__generator
    if (!generator) return
    generator.tick += 1

    if (ws.__kline) {
      ws.send(JSON.stringify(generator.kline()), function (err) {
        !err && console.log('kline data has been sent')
      })
    }

    if (ws.__ticker) {
      ws.send(JSON.stringify(generator.ticker()), function (err) {
        !err && console.log('ticker data has been sent')
      })
    }

    if (ws.__depth) {
      ws.send(JSON.stringify(generator.depth()), function (err) {
        !err && console.log('depth data has been sent')
      })
    }

    if (ws.__trade) {
      ws.send(JSON.stringify(generator.trade()), function (err) {
        !err && console.log('trades data has been sent')
      })
    }
  })
}, 3 * 1000)

server.on('request', app)
server.listen(1918, function () {
  console.log('Listening on http://localhost:1918')
})
