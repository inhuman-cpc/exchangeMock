const kline = require('../mocks/kline.json')

let startTime = new Date(2017, 0, 1).getTime() / 1000
let pointsLength = 240
let ticks = 0

setInterval(function () {
  ticks += 1
}, 3000)

function parseInterval (interval) {
  let map = {
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
    w: 60 * 60 * 24 * 7
  }
  let strs = interval.split('')
  let unit = strs.pop()

  return map[unit] * strs.join('')
}

function generateTimes (startTime, interval) {
  let list = new Array(pointsLength)
  let increaseAmount = parseInterval(interval)
  for (let i = 0; i < pointsLength; i += 1) {
    list[i] = startTime + i * increaseAmount
  }

  return list
}

function generateAsksBids (ask1, bid1) {
  let len = 12
  let asks = []
  let bids = []
  for (let i = 0; i < len; i += 1) {
    let ask = parseFloat(ask1) + 0.0001 * i
    let bid = parseFloat(bid1) - 0.0001 * i
    asks.push([ask.toFixed(6), (Math.random() * 1000).toFixed(6)])
    bids.push([bid.toFixed(6), (Math.random() * 1000).toFixed(6)])
  }
  return {asks, bids}
}

function generateTrades (total = 30) {
  let trades = []
  for (let i = 0; i < total; i += 1) {
    let index = parseInt(Math.random() * 500)
    let row = kline[index]
    trades.push({
      time: row[0], id: row[0].toString(), price: row[1], quantity: (Math.random() * 1000).toFixed(6)
    })
  }

  return trades
}

const handler = {
  kline: function (interval = '1m') {
    let times = generateTimes(startTime, interval)
    return {
      channel: 'kline',
      data: kline.slice(0, pointsLength).map((row, index) => {
        return [times[index], row[1], row[2], row[3], row[4], row[5]]
      })
    }
  },
  ticker: function () {
    let index = parseInt(Math.random() * 500)
    let row = kline[index]
    return {
      channel: 'ticker',
      data: {
        exchange_info: {
          price: row[1],
          price_change: (row[4] - row[1]).toFixed(6),
          price_change_percent: (row[4] - row[1]) / row[1],
          quote_volume: row[5],
          symbol: 'BTC-ETH',
          volume: row[5]
        },
        'quote_currency': 'CNY'
      }
    }
  },
  depth: function () {
    let index = parseInt(Math.random() * 500)
    let row = kline[index]
    let info = generateAsksBids(row[2], row[3])
    return {
      channel: 'depth',
      data: {
        ...info,
        timestamp: Date.now()
      }
    }
  },
  trades: function () {
    return {
      channel: 'trades',
      data: generateTrades()
    }
  },
  fetchLatestKline: function () {
    let index = parseInt(Math.random() * 500)
    let row = kline[index]
    return {
      channel: 'kline',
      data: [startTime + (ticks + 240) * 60, row[1], row[2], row[3], row[4], row[5]]
    }
  },
  fetchLatestTrades: function () {
    let total = parseInt(Math.random() * 10)
    total = total < 1 ? 1 : total
    return {
      channel: 'trades',
      data: generateTrades(total)
    }
  }
}

const fs = require('fs')
let txt = ''
for (let key in handler) {
  txt += JSON.stringify(handler[key](), null, ' ')
}
fs.writeFile('./text.log', txt)

// console.log(handler.depth())

// console.log(handler.fetchKLine('1m', new Date(2017, 0, 1).getTime() / 1000))

module.exports = handler
