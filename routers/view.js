const router = require('express').Router()
const MongoDBService = require('../../photos-common/services/MongoDBService')
const Album = require('../../photos-common/models/album')
const Photo = require('../../photos-common/models/photo')
const User = require('../../photos-common/models/user')
const photoDB = new Photo(MongoDBService.colls.photos)
const albumDB = new Album(MongoDBService.colls.albums)
const userDB = new User(MongoDBService.colls.users)

require('express-async-errors')

const cacheControl = require('express-cache-controller')
router.use(cacheControl({
  private: true,
  noCache: true
}))

router.get('/album/:albumId', async (req, res) => {
  if (!Album.validateId(req.params.albumId)) {
    return res.status(400).end()
  }
  // pagination
  const details = req.query.details || 'default'
  const albumOpt = {
    details: details,
    includeId: true,
    sort: req.query.sort || 'name:1',
    skip: parseInt(Number(req.query.skip || 0)),
    limit: Math.min(parseInt(Number(req.query.limit || 0)) || 200, 200)
  }
  const photoOpt = {
    details: details,
    includeId: true,
    sort: req.query.sort || 'created:1',
    skip: parseInt(Number(req.query.skip || 0)),
    limit: Math.min(parseInt(Number(req.query.limit || 0)) || 120, 120)
  }
  const userOpt = {
    details: details,
    includeId: true,
    sort: req.query.sort || 'userName:1',
    skip: parseInt(Number(req.query.skip || 0)),
    limit: Math.min(parseInt(Number(req.query.limit || 0)) || 200, 200)
  }
  // details
  const album = await albumDB.getItems({ id: req.params.albumId }, { details: 'all', includeId: true }, { one: true })
  const albumItems = await albumDB.getItems({ albumId: req.params.albumId }, albumOpt, { one: false })
  const photoItems = await photoDB.getItems({ albumId: req.params.albumId }, photoOpt, { one: false })
  // users
  const userIdSet = new Set()
  albumItems.forEach(item => item.userId ? userIdSet.add(item.userId) : null)
  photoItems.forEach(item => item.userId ? userIdSet.add(item.userId) : null)
  const userIds = Array.from(userIdSet.values())
  const userItems = await userDB.getItems({ id: { $in: userIds } }, userOpt, { one: false })
  // size
  const pathPrefix = await albumDB.findOne(req.params.albumId, Photo.projections.path({ includeId: false }))
  const albumSize = pathPrefix ? (await photoDB.getPathPrefixSize(pathPrefix.path)) : null
  // ret
  return res.status(200).json({
    album,
    albumSize,
    albums: {
      count: await albumDB.countChildItems(req.params.albumId),
      params: albumOpt,
      items: albumItems
    },
    photos: {
      count: await photoDB.countChildItems(req.params.albumId),
      params: photoOpt,
      items: photoItems
    },
    users: {
      count: userIds.length,
      params: userOpt,
      items: userItems
    }
  })
})

module.exports = router
