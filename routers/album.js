const router = require('express').Router()
const config = require('../config')
const MongoDBService = require(config.common('./services/MongoDBService'))
const Album = require(config.common('./models/Album'))
const albumDB = new Album(MongoDBService.colls.albums)

const idLength = 64

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
  if (!(projection in Album.projections)) projection = 'apiBasic'
  const album = await albumDB.findOne(id, Album.projections[projection])
  // ret
  if (album) {
    return res.status(200).json(Album.publicTransform(album, details, includeId))
  } else {
    return res.status(404).json({})
  }
})

module.exports = router
