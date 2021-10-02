require('dotenv')
const pathlib = require('path')

module.exports = {
  port: process.env.PORT,
  api: {
    tnCache: pathlib.join(process.env.CACHE_LOCATION, 'thumbnails'),
    profilePictures: process.env.PROFILE_PICTURES_LOCATION
  },
  proc: {
    host: process.env.PROC_HOST,
    queuePrefix: process.env.PROC_QUEUE_PREFIX,
    processes: Number(process.env.PROC_NUMBER),
    logLevel: process.env.PROC_LOG_LEVEL
  },
  queues: {
    tracker: process.env.QUEUE_TRACKER,
    processor: process.env.QUEUE_PROCESSOR
  },
  caches: {
    converted: {
      root: process.env.CACHE_CONVERTED_ROOT,
      levels: Number(process.env.CACHE_CONVERTED_LEVELS),
      expire: Number(process.env.CACHE_CONVERTED_EXPIRE)
    },
    thumbnail: {
      root: process.env.CACHE_THUMBNAIL_ROOT,
      levels: Number(process.env.CACHE_THUMBNAIL_LEVELS),
      expire: Number(process.env.CACHE_THUMBNAIL_EXPIRE)
    }
  },
  redis: {
    host: process.env.RD_HOST,
    password: process.env.RD_PWD
  },
  mongo: {
    uri: process.env.MONGO_URI,
    db: process.env.MONGO_DB,
    collections: {
      users: process.env.MONGO_COLL_USERS,
      albums: process.env.MONGO_COLL_ALBUMS,
      photos: process.env.MONGO_COLL_PHOTOS
    },
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  }
}
