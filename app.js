const express = require('express')
const helmet = require('helmet')

// application
const app = express()

// middlewares
app.use(helmet())

// /api-docs
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
app.use('/api-docs', (req, res, next) => {
  req.swaggerDoc = YAML.load('./api-docs.yaml')
  next()
}, swaggerUi.serve, swaggerUi.setup())

// /content
const routerContent = require('./routers/content')
app.use('/content', routerContent)

module.exports = app
