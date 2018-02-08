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
    asks.push([parseFloat(ask1) + 0.0001, parseInt(Math.random() * 1000 * i) + 10])
    bids.push([parseFloat(bid1) - 0.0001, parseInt(Math.random() * 1000 * i) + 10])
  }
  return {asks, bids}
}

const handler = {
  kline: function (params, isRealtime) {
    let times = generateTimes(startTime, params.interval)
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
          price: row[5],
          price_change: row[5] - row[1],
          price_change_percent: (row[5] - row[1]) / row[5],
          quote_volume: row[6],
          symbol: 'BTC-ETH',
          volume: row[6]
        },
        'quote_currency': 'CNY'
      }
    }
  },
  fetchLatestKline: function () {
    let index = parseInt(Math.random() * 500)
    let row = kline[index]
    return {
      chanel: 'kline',
      data: [startTime + (ticks + 240) * 60, row[1], row[2], row[3], row[4], row[5]]
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
  }
}

// console.log(handler.depth())

// console.log(handler.fetchKLine('1m', new Date(2017, 0, 1).getTime() / 1000))

module.exports = handler
