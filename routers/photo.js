const router = require('express').Router()
const config = require('../config')
const MongoDBService = require(config.common('./services/MongoDBService'))
const Photo = require(config.common('./models/Photo'))
const photoDB = new Photo(MongoDBService.colls.photos)

const idLength = 128

require('express-async-errors')

const cacheControl = require('express-cache-controller')
router.use(cacheControl({
  private: true,
  noCache: true
}))

router.get('/:id', async (req, res) => {
  const id = req.params.id
  if (typeof id !== 'string' || id.length !== idLength) {
    return res.status(400).end()
  }
  // includeId
  const includeId = Boolean(req.query.includeId)
  // details
  const details = (req.query.details || 'basic').toLowerCase()
  let projection = ['api', details[0].toUpperCase() + details.slice(1)].join('')
  if (!(projection in Photo.projections)) projection = 'apiBasic'
  const photo = await photoDB.findOne(id, Photo.projections[projection])
  // ret
  if (photo) {
    return res.status(200).json(Photo.publicTransform(photo, details, includeId))
  } else {
    return res.status(404).json({})
  }
})

module.exports = router
