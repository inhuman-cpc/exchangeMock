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
    if (msg.event === 'subscribe') {
      tasks.push(ws)
      ws[`__${msg.channel}`] = true
      ws.send(JSON.stringify(handler[msg.channel](msg.interval)), function (err) {
        !err && console.log('data has been sent')
      })
    } else {
      ws[`__${msg.channel}`] = false
    }
  })
})

// 模拟分时图
setInterval(function () {
  tasks.forEach(function (ws) {
    if (ws.__kline) {
      ws.send(JSON.stringify(handler.fetchLatestKline()), function (err) {
        !err && console.log('kline data has been sent')
      })
    }

    if (ws.__ticker) {
      setTimeout(function () {
        ws.send(JSON.stringify(handler.ticker()), function (err) {
          !err && console.log('ticker data has been sent')
        })
      }, 500)
    }

    if (ws.__depth) {
      setTimeout(function () {
        ws.send(JSON.stringify(handler.depth()), function (err) {
          !err && console.log('depth data has been sent')
        })
      }, 1500)
    }

    if (ws.__trades) {
      setTimeout(function () {
        ws.send(JSON.stringify(handler.fetchLatestTrades()), function (err) {
          !err && console.log('depth data has been sent')
        })
      }, 2500)
    }
  })
}, 3000)

server.on('request', app)
server.listen(9000, function () {
  console.log('Listening on http://localhost:9000')
})
