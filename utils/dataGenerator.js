let kline = require('../mocks/kline.json')
let numeral = require('numeral')

function getRandomRow () {
  let index = parseInt(Math.random() * kline.length)
  return kline[index] || index[0]
}

function format (num) {
  return numeral(parseFloat(num) || 0).format('0[.]00000000')
}

function mockAmount (max = 100, min = 0.1) {
  return numeral(Math.random() * max + min).format('0[.]00000000')
}

function generateTimes (startTime, interval) {
  const pointsLength = kline.length
  let list = new Array(pointsLength)
  let increaseAmount = parseInterval2Ms(interval)
  for (let i = 0; i < pointsLength; i += 1) {
    list[i] = startTime + i * increaseAmount
  }

  return list
}

function parseInterval2Ms (interval) {
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
    // [价格，数量]
    asks.push([format(ask), mockAmount()])
    bids.push([format(bid), mockAmount()])
  }
  return {asks, bids}
}

function generateTrades (total = 30, latestTime) {
  if (total === 1) {
    let row = getRandomRow()
    return [
      // [价格, 成交量, 时间戳, 买卖类型]
      [format(row[1]), mockAmount(), Date.now(), Date.now() % 2 ? 'SELL' : 'BUY']
    ]
  }

  let trades = []
  for (let i = 0; i < total; i += 1) {
    let row = kline[i]
    let time = kline[(kline.length - 1 - i) % kline.length][0]
    // [价格, 成交量, 时间戳, 买卖类型]
    trades.push([
      format(row[1]),
      mockAmount(150, 0.2),
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
    return lastItem + this.tick * parseInterval2Ms(this.interval)
  }

  kline () {
    let row = kline[this.tick % kline.length]
    return {
      channel: 'kline',
      data: {
        symbol: 'ETH_BTC',
        candles: [
          // [时间,开盘价,最高价,最低价,收盘价,成交量]
          [
            this.latestTime(),
            format(row[1]),
            format(row[2]),
            format(row[3]),
            format(row[4]),
            format(row[5])
          ]
        ]
      }
    }
  }

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
    return {
      channel: 'ticker',
      data: {
        tickers: [
          [
            'ETH_BTC',
            format(row[2]),
            format(row[5]),
            numeral((row[2] - row[3]) / row[3]).format('0[.]0000'),
            numeral(row[2] - row[3]).format('0[.]000000'),
            format(row[2]),
            format(row[3])
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
      data: Object.assign(info, {
        symbol: 'ETH_BTC'
      })
    }
  }
}

// function test () {
//   let fs = require('fs')
//   kline = kline.slice(0, 5)
//   let date = new Date(2017, 0, 1)
//   let gen = new DataGenerator(date.getTime(), '1m')
//   gen.tick += 1
//   let str = ''
//   'kline,ticker,depth,trade'.split(',').forEach(key => {
//     str += `${key}:\n${JSON.stringify(gen[key](), null, ' ')}\n\n`
//   })
//
//   fs.writeFileSync('./test.log', str)
// }
//
// test()

module.exports = DataGenerator
