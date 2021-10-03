const $router = require('express').Router()

const MongoDBService = require('../../photos-common/services/MongoDBService')
const User = require('../../photos-common/models/user2')
User.init({ coll: MongoDBService.colls.users })

require('express-async-errors')
const { ApiError } = require('../../photos-common/errors')

async function getUser (id, details = 'default', { includeId = false } = {}) {
  if (!User.validateId(id)) {
    throw new ApiError({
      status: 400,
      message: 'Invalid \'userId\'.'
    })
  }
  const aggrOpts = { includeId }
  const item = await User.apiGet(id, details, aggrOpts, { one: true })
  if (!item) {
    throw new ApiError({
      status: 404,
      message: 'User not found.'
    })
  }
  return item
}

async function getUsers (ids, details = 'default', { includeId = true, sort = undefined, skip = 0, limit = 20 }) {
  if (!ids.every(id => User.validateId(id))) {
    throw new ApiError({
      status: 400,
      message: 'Invalid \'userId\'.'
    })
  }
  const aggrOpts = { includeId, sort, skip, limit }
  const items = await User.apiGet({ id: { $in: ids } }, details, aggrOpts, { one: false })
  return items
}

$router.get('/:id', async (req, res) => {
  return res.json(await getUser(req.params.id, req.query.details || 'default', {
    includeId: Boolean(req.query.includeId)
  }))
})

module.exports = {
  $router,
  getUser,
  getUsers
}
