const router = require('express').Router()
const MongoDBService = require('../../photos-common/services/MongoDBService')
const Album = require('../../photos-common/models/album')
const albumDB = new Album(MongoDBService.colls.albums)

require('express-async-errors')

const cacheControl = require('express-cache-controller')
router.use(cacheControl({
  private: true,
  noCache: true
}))

function validateAlbumId (req, res, next) {
  if (!Album.validateId(req.params.id)) {
    return res.status(400).end()
  } else {
    next()
  }
}

router.get('/:id', validateAlbumId, async (req, res) => {
  // includeId
  const opt = {
    details: req.query.details,
    includeId: Boolean(req.query.includeId)
  }
  // details
  const album = await albumDB.getItems({ id: req.params.id }, opt, { one: true })
  // ret
  if (album) {
    return res.status(200).json(album)
  } else {
    return res.status(404).json({})
  }
})

router.get('/in/:id', validateAlbumId, async (req, res) => {
  // pagination
  const opt = {
    details: req.query.details,
    includeId: true,
    sort: req.query.sort || 'name:1',
    skip: parseInt(Number(req.query.skip || 0)),
    limit: Math.min(parseInt(Number(req.query.limit || 0)) || 120, 120)
  }
  // details
  const items = await albumDB.getItems({ albumId: req.params.id }, opt, { one: false })
  // ret
  return res.status(200).json({
    count: await albumDB.countChildItems(req.params.id),
    ...opt,
    items
  })
})

module.exports = router
