const express = require('express')
const helmet = require('helmet')

// application
const app = express()

// middlewares
app.use(helmet())

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
const albumPhoto = require('./routers/album')
app.use('/album', albumPhoto)

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
