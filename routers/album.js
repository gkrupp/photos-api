const router = require('express').Router()

const MongoDBService = require('../../photos-common/services/MongoDBService')
const Photo = require('../../photos-common/models/photo2')
const Album = require('../../photos-common/models/album2')
Photo.init({ coll: MongoDBService.colls.photos })
Album.init({
  coll: MongoDBService.colls.albums,
  photo: Photo
})

require('express-async-errors')

router.get('/:id', async (req, res) => {
  if (!Album.validateId(req.params.id)) {
    return res.status(400).end()
  }
  // get
  const aggrOpts = {
    includeId: Boolean(req.query.includeId)
  }
  try {
    const item = await Album.apiGet(req.params.id, req.query.details, aggrOpts, { one: true })
    // ret
    if (item) {
      return res.status(200).json(item)
    } else {
      return res.status(404).json({})
    }
  } catch (err) {
    return res.status(400).json({})
  }
})

router.get('/:id/albums', async (req, res) => {
  if (!Album.validateId(req.params.id)) {
    return res.status(400).end()
  }
  // pagination
  const aggrOpts = {
    includeId: true,
    sort: req.query.sort || 'name:1', // sorting is different for albums and photos
    skip: parseInt(Number(req.query.skip || 0)),
    limit: Math.min(parseInt(Number(req.query.limit || 0)) || 200, 200)
  }
  // get
  try {
    const items = await Album.apiGet({ albumId: req.params.id }, req.query.details, aggrOpts, { one: false })
    // ret
    return res.status(200).json({
      count: await Album.children(req.params.id, null, { count: true }),
      params: aggrOpts,
      items
    })
  } catch (err) {
    return res.status(400).json({})
  }
})

router.get('/:id/photos', async (req, res) => {
  if (!Album.validateId(req.params.id)) {
    return res.status(400).end()
  }
  // pagination
  const aggrOpts = {
    includeId: true,
    sort: req.query.sort || 'created:1', // sorting is different for albums and photos
    skip: parseInt(Number(req.query.skip || 0)),
    limit: Math.min(parseInt(Number(req.query.limit || 0)) || 120, 120)
  }
  // get
  try {
    const items = await Photo.apiGet({ albumId: req.params.id }, req.query.details, aggrOpts, { one: false })
    // ret
    return res.status(200).json({
      count: await Photo.children(req.params.id, null, { count: true }),
      params: aggrOpts,
      items
    })
  } catch (err) {
    return res.status(400).json({})
  }
})

router.get('/:id/info', async (req, res) => {
  if (!Album.validateId(req.params.id)) {
    return res.status(400).end()
  }
  // size
  const album = await Album.findOne(req.params.albumId, Album.projections.path({ includeId: false }))
  if (album === null) {
    return res.status(404).json({})
  }
  const info = await Album.getInfo(album.path, { size: true, span: true })
  // ret
  if (info) {
    const ret = { info }
    if (req.query.includeId) ret.id = req.params.id
    return res.status(200).json(ret)
  } else {
    return res.status(404).json({})
  }
})

module.exports = router
