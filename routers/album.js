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

router.get('/:id', async (req, res) => {
  if (!Album.validateId(req.params.id)) {
    return res.status(400).end()
  }
  // includeId
  const opt = {
    details: req.query.details,
    includeId: Boolean(req.query.includeId)
  }
  // details
  const item = await albumDB.getItems({ id: req.params.id }, opt, { one: true })
  // ret
  if (item) {
    return res.status(200).json(item)
  } else {
    return res.status(404).json({})
  }
})

router.get('/in/:albumId', async (req, res) => {
  if (!Album.validateId(req.params.albumId)) {
    return res.status(400).end()
  }
  // pagination
  const opt = {
    details: req.query.details,
    includeId: true,
    sort: req.query.sort || 'name:1', // sorting is different for albums and photos
    skip: parseInt(Number(req.query.skip || 0)),
    limit: Math.min(parseInt(Number(req.query.limit || 0)) || 200, 200)
  }
  // details
  const items = await albumDB.getItems({ albumId: req.params.albumId }, opt, { one: false })
  // ret
  return res.status(200).json({
    count: await albumDB.countChildItems(req.params.albumId),
    params: opt,
    items
  })
})

module.exports = router
