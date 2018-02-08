let WebSocketServer = require('ws').Server
let express = require('express')
let path = require('path')
let app = express()
let handler = require('./utils')
let server = require('http').createServer()

let tasks = []

app.use(express.static(path.join(__dirname, '/public')))

let wss = new WebSocketServer({server: server, path: '/websocket'})
wss.on('connection', function (ws, req) {
  // req.headers['Acees-Control-Allow-Origin'] = '*'
  ws.on('close', function () {
    console.log('stopping client interval')
  })

  ws.on('message', function (msg) {
    msg = JSON.parse(msg)
    tasks.push(ws)
    if (msg.interval) {
      ws.__interval = msg.interval
    }
    ws.send(JSON.stringify(handler[msg.channel](msg)), function (err) {
      !err && console.log('data has been sent')
    })
  })
})

// 模拟分时图
setInterval(function () {
  tasks.forEach(function (ws) {
    ws.send(JSON.stringify(handler.fetchLatestKline()), function (err) {
      !err && console.log('kline data has been sent')
    })

    setTimeout(function () {
      ws.send(JSON.stringify(handler.ticker()), function (err) {
        !err && console.log('ticker data has been sent')
      })
    }, 1000)

    setTimeout(function () {
      ws.send(JSON.stringify(handler.depth()), function (err) {
        !err && console.log('depth data has been sent')
      })
    }, 2000)
  })
}, 3000)

server.on('request', app)
server.listen(9000, function () {
  console.log('Listening on http://localhost:9000')
})
