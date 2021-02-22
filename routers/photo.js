const router = require('express').Router()
const config = require('../config')
const MongoDBService = require(config.common('./services/MongoDBService'))
const Album = require(config.common('./models/Album'))
const Photo = require(config.common('./models/Photo'))
const photoDB = new Photo(MongoDBService.colls.photos)

const defaultDetails = 'minimal'
const defaultProjection = 'apiMinimal'

require('express-async-errors')

const cacheControl = require('express-cache-controller')
router.use(cacheControl({
  private: true,
  noCache: true
}))

router.get('/:id', async (req, res) => {
  const id = req.params.id
  if (!Photo.validateId(id)) {
    return res.status(400).end()
  }
  // includeId
  const includeId = Boolean(req.query.includeId)
  // details
  const details = (req.query.details || defaultDetails).toLowerCase()
  let projection = ['api', details[0].toUpperCase() + details.slice(1)].join('')
  if (!(projection in Photo.projections)) projection = defaultProjection
  const photo = await photoDB.findOne(id, Photo.projections[projection])
  // ret
  if (photo) {
    return res.status(200).json(Photo.publicTransform(photo, details, { includeId }))
  } else {
    return res.status(404).json({})
  }
})

router.get('/in/:albumId', async (req, res) => {
  const albumId = req.params.albumId
  if (!Album.validateId(albumId)) {
    return res.status(400).end()
  }
  // pagination
  const skip = parseInt(Number(req.query.skip || 0))
  const limit = Math.min(parseInt(Number(req.query.limit || 0)) || 60, 60)
  const sort = { created: 1 }
  // details
  const details = (req.query.details || defaultDetails).toLowerCase()
  let projection = ['api', details[0].toUpperCase() + details.slice(1)].join('')
  if (!(projection in Photo.projections)) projection = defaultProjection
  const cursor = await photoDB.find({ albumId }, Photo.projections[projection], { sort, skip, limit, toArray: false, count: false })
  // ret
  return res.status(200).json({
    count: await cursor.count(),
    skip,
    limit,
    items: (await cursor.toArray()).map((item) => Photo.publicTransform(item, details))
  })
})

module.exports = router
