const $router = require('express').Router()
const MongoDBService = require('../../photos-common/services/MongoDBService')
const Photo = require('../../photos-common/models/photo2')
Photo.init({ coll: MongoDBService.colls.photos })

require('express-async-errors')
const { ApiError } = require('../../photos-common/errors')

async function getPhoto (id, details = 'default', { includeId = false } = {}) {
  if (!Photo.validateId(id)) {
    throw new ApiError({
      status: 400,
      message: 'Invalid \'photoId\'.'
    })
  }
  const aggrOpts = { includeId }
  const item = await Photo.apiGet(id, details, aggrOpts, { one: true })
  if (!item) {
    throw new ApiError({
      status: 404,
      message: 'Photo not found.'
    })
  }
  return item
}

$router.get('/:id', async (req, res) => {
  return res.json(await getPhoto(req.params.id, req.query.details || 'default', {
    includeId: Boolean(req.query.includeId)
  }))
})

module.exports = {
  $router,
  getPhoto
}
