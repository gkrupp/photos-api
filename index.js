const dotenv = require('dotenv')
dotenv.config({ path: './config/.env' })
const config = require('./config')

const MongoDBService = require('../photos-common/services/MongoDBService')
// const QueueService = require('../photos-common/services/QueueService')
let server = null

async function init () {
  // DB init
  await MongoDBService.init(config.mongo)
  // app
  const app = require('./app')
  server = app.listen(config.port, () => {
    console.log('Server started')

    // Process start signal
    process.send = process.send || (() => {})
    process.send('ready')
  })
}

async function stop () {
  console.log('Shutting down..')
  try {
    await server.stop()
    await MongoDBService.stop()
  } catch (err) {
    return process.exit(1)
  }
  return process.exit(0)
}

init()

process.on('SIGINT', () => {
  stop()
})
