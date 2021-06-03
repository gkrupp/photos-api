const router = require('express').Router()
const MongoDBService = require('../../photos-common/services/MongoDBService')
const User = require('../../photos-common/models/user')
const userDB = new User(MongoDBService.colls.users)

require('express-async-errors')

const cacheControl = require('express-cache-controller')
router.use(cacheControl({
  private: true,
  noCache: true
}))

router.get('/:id', async (req, res) => {
  if (!User.validateId(req.params.id)) {
    return res.status(400).end()
  }
  // includeId
  const opt = {
    details: req.query.details,
    includeId: Boolean(req.query.includeId)
  }
  // details
  const item = await userDB.getItems({ id: req.params.id }, opt, { one: true })
  // ret
  if (item) {
    return res.status(200).json(item)
  } else {
    return res.status(404).json({})
  }
})

module.exports = router
