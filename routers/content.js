const fs = require('fs')
const router = require('express').Router()
const MongoDBService = require('../../photos-common/services/MongoDBService')
const Album = require('../../photos-common/models/album')
const Photo = require('../../photos-common/models/photo')
const albumDB = new Album(MongoDBService.colls.albums)
const photoDB = new Photo(MongoDBService.colls.photos)

require('express-async-errors')

const cacheControl = require('express-cache-controller')
router.use(cacheControl({
  private: true,
  maxAge: 24 * 60 * 60,
  noTransform: true
}))

router.get('/album/:id', async (req, res) => {
  const id = req.params.id
  if (!Album.validateId(id)) {
    return res.status(400).end()
  }
  // get arhive
  const serve = await albumDB.getServedFromId(id)
  // test dir
  if (!serve) return res.status(404).end()
  // stat
  albumDB.updateEventStat(id, 'served')
  // serve
  res.header('Content-Type', 'application/zip')
  res.header('Content-Disposition', `attachment; filename="${serve.fileName}.zip"`)
  res.status(200)
  serve.archive.pipe(res)
  await serve.archive.finalize()
})

router.get('/photo/:id', async (req, res) => {
  const id = req.params.id
  if (!Photo.validateId(id)) {
    return res.status(400).end()
  }
  // get path
  const size = (req.query.size || 'h1200').toLowerCase()
  const serve = await photoDB.getServedFromId(id, size)
  // test tn
  if (!serve) return res.status(404).end()
  await fs.promises.access(serve.path)
  // stat
  photoDB.updateEventStat(id, 'served', size)
  // serve
  res.header('Content-Disposition', `inline; filename="${serve.fileName}"`)
  return res.status(200).sendFile(serve.path)
})

module.exports = router
