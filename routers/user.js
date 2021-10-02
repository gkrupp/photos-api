const router = require('express').Router()

const MongoDBService = require('../../photos-common/services/MongoDBService')
const User = require('../../photos-common/models/user2')
User.init({ coll: MongoDBService.colls.users })

require('express-async-errors')

router.get('/:id', async (req, res) => {
  if (!User.validateId(req.params.id)) {
    return res.status(400).end()
  }
  // get
  const aggrOpts = {
    includeId: Boolean(req.query.includeId)
  }
  try {
    const item = await User.apiGet(req.params.id, req.query.details, aggrOpts, { one: true })
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
