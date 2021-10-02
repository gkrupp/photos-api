const router = require('express').Router()
const MongoDBService = require('../../photos-common/services/MongoDBService')
const Photo = require('../../photos-common/models/photo2')
Photo.init({ coll: MongoDBService.colls.photos })

require('express-async-errors')

router.get('/:id', async (req, res) => {
  if (!Photo.validateId(req.params.id)) {
    return res.status(400).end()
  }
  // get
  const aggrOpts = {
    includeId: Boolean(req.query.includeId)
  }
  try {
    const item = await Photo.apiGet(req.params.id, req.query.details, aggrOpts, { one: true })
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

module.exports = router
