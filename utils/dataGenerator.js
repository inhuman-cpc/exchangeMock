let kline = require('../mocks/kline.json')

function getRandomRow () {
  let index = parseInt(Math.random() * kline.length)
  return kline[index] || index[0]
}

function generateTimes (startTime, interval) {
  const pointsLength = kline.length
  let list = new Array(pointsLength)
  let increaseAmount = parseInterval(interval)
  for (let i = 0; i < pointsLength; i += 1) {
    list[i] = startTime + i * increaseAmount
  }

  return list
}

function parseInterval (interval) {
  let map = {
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
    w: 60 * 60 * 24 * 7
  }
  let strs = interval.split('')
  let unit = strs.pop()

  return map[unit] * strs.join('') * 1000
}

function generateAsksBids (ask1, bid1) {
  let len = 12
  let asks = []
  let bids = []
  for (let i = 0; i < len; i += 1) {
    let ask = parseFloat(ask1) + 0.0001 * i
    let bid = parseFloat(bid1) - 0.0001 * i
    asks.push([parseFloat(ask.toFixed(6)), parseFloat((Math.random() * 1000).toFixed(6))])
    bids.push([parseFloat(bid.toFixed(6)), parseFloat((Math.random() * 1000).toFixed(6))])
  }
  return {asks, bids}
}

function generateTrades (total = 30, latestTime) {
  if (total === 1) {
    let row = getRandomRow()
    return [
      [parseFloat(row[1]), parseFloat((Math.random() * 1000).toFixed(6)), Date.now(), Date.now() % 2 ? 'SELL' : 'BUY']
    ]
  }

  let trades = []
  for (let i = 0; i < total; i += 1) {
    let row = kline[i]
    let time = kline[(kline.length - 1 - i) % kline.length][0]
    // [价格, 成交量, 时间戳, 买卖类型]
    trades.push([
      parseFloat(row[1]),
      parseFloat((Math.random() * 1000).toFixed(6)),
      time,
      i % 2 ? 'SELL' : 'BUY'
    ])
  }

  return trades
}

class DataGenerator {
  constructor (startTime, interval) {
    this.interval = interval
    this.start = startTime
    this.tick = 0
    this.times = generateTimes(this.start, this.interval)
  }

  latestTime () {
    let lastItem = this.times[this.times.length - 1]
    return lastItem + this.tick * parseInterval(this.interval)
  }

  // 使用接口去拉取
  // kline () {
  //   return {
  //     channel: 'kline',
  //     data: {
  //       symbol: 'ETH_BTC',
  //       candles: kline.map((row, index) => {
  //         return [this.times[index], parseFloat(row[1]), parseFloat(row[2]), parseFloat(row[3]), parseFloat(row[4]), parseFloat(row[5])]
  //       })
  //     }
  //   }
  // }

  kline () {
    let row = kline[this.tick % kline.length]
    return {
      channel: 'kline',
      data: {
        symbol: 'ETH_BTC',
        candles: [
          [
            this.latestTime(),
            parseFloat(row[1]),
            parseFloat(row[2]),
            parseFloat(row[3]),
            parseFloat(row[4]),
            parseFloat(row[5])
          ]
        ]
      }
    }
  }

  // 首次ajax拉取
  // trade () {
  //   return {
  //     channel: 'trade',
  //     data: {
  //       trades: generateTrades(30),
  //       symbol: 'ETH_BTC'
  //     }
  //   }
  // }

  trade () {
    return {
      channel: 'trade',
      data: {
        trades: generateTrades(1, this.latestTime()),
        symbol: 'ETH_BTC'
      }
    }
  }

  ticker () {
    let row = kline[this.tick % kline.length]
    // [交易对，价格，24小时成交量，24小时涨跌幅，24小时涨跌额，24小时最高价，24小时最低价]
    // [['ETH_BTC', 200.00, 300.00, 400.00, 500.00, 600.00, 100.00]]
    return {
      channel: 'ticker',
      data: {
        tickers: [
          [
            'ETH_BTC',
            parseFloat(row[2]),
            parseFloat(row[5]),
            parseFloat((row[2] - row[3]) / row[3]),
            parseFloat(row[2] - row[3]),
            parseFloat(row[2]),
            parseFloat(row[3])
          ]
        ]
      }
    }
  }

  depth () {
    let row = kline[this.tick % kline.length]
    let info = generateAsksBids(row[2], row[3])
    return {
      channel: 'depth',
      data: {
        ...info,
        symbol: 'ETH_BTC'
      }
    }
  }
}

// kline = kline.slice(0, 5)
// const timerInterval = 3000
// let date = new Date(2017, 0, 1)
// let gen = new DataGenerator(date.getTime() / 1000, '1m')
// console.log(gen.trades())
// setInterval(function () {
//   gen.tick += 1
//   console.log(gen.ticker())
//   console.log(JSON.stringify(gen.depth(), null, ' '))
// }, timerInterval)

module.exports = DataGenerator
