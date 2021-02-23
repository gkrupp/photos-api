const fs = require('fs')
const router = require('express').Router()
const MongoDBService = require('../../photos-common/services/MongoDBService')
// const Album = require('../../photos-common/models/album')
const Photo = require('../../photos-common/models/photo')
const photoDB = new Photo(MongoDBService.colls.photos)

require('express-async-errors')

const cacheControl = require('express-cache-controller')
router.use(cacheControl({
  private: true,
  maxAge: 24 * 60 * 60,
  noTransform: true
}))

router.get('/photo/:id', async (req, res) => {
  const id = req.params.id
  if (typeof id !== 'string' || id.length !== 128) {
    return res.status(400).end()
  }
  // get path
  const size = (req.query.size || 'preview').toLowerCase()
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
