const express = require('express')
const helmet = require('helmet')
const cors = require('cors')

// application
const app = express()

// middlewares
app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    callback(null, ['https://photos.gkrupp.hu', 'http://localhost:6001'].includes(origin))
  }
}))

// /api-docs
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express')
  const YAML = require('yamljs')
  app.use('/api-docs', (req, res, next) => {
    req.swaggerDoc = YAML.load('./api-docs.yaml')
    next()
  }, swaggerUi.serve, swaggerUi.setup())
}

// /content
const routerContent = require('./routers/content')
app.use('/content', routerContent)

// /photo
const routerPhoto = require('./routers/photo')
app.use('/photo', routerPhoto)

// /album
const routerAlbum = require('./routers/album')
app.use('/album', routerAlbum)

// /user
const routerUser = require('./routers/user')
app.use('/user', routerUser)

// /view
const routerView = require('./routers/view')
app.use('/view', routerView)

// unknown path
app.use(async (req, res) => {
  return res.status(404).end()
})

// error handling
app.use(async (err, req, res, next) => {
  if (err.name === 'Error' && err.code === 'ENOENT') {
    return res.status(404).end()
  } else {
    console.error(err, err.name, err.code)
    return res.status(500).end()
  }
})

module.exports = app
