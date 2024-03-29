const config = require('../config')
const fs = require('fs')
const pathlib = require('path')
const $router = require('express').Router()

const MongoDBService = require('../../photos-common/services/MongoDBService')
const Album = require('../../photos-common/models/album2')
const Photo = require('../../photos-common/models/photo2')
const User = require('../../photos-common/models/user2')
Album.init({ coll: MongoDBService.colls.albums })
Photo.init({ coll: MongoDBService.colls.photos })
User.init({ coll: MongoDBService.colls.users })

const archiver = require('archiver')
const sharp = require('sharp')

const FileCacheService = require('../../photos-common/services/FileCacheService')
const FileCache = new FileCacheService(config.caches.thumbnail)

require('express-async-errors')
const { pathPrefixRegExp } = require('../../photos-common/utils')
const { ApiError } = require('../../photos-common/errors')

$router.get('/album/:id/zip', async (req, res) => {
  const id = req.params.id
  if (!Album.validateId(id)) {
    throw new ApiError({
      status: 400,
      message: 'Invalid \'albumId\'.'
    })
  }
  const album = await Album.findOne(id, Album.projections.serve({ includeId: false }))
  if (!album) {
    throw new ApiError({
      status: 404,
      message: 'Album not found.'
    })
  }
  //
  const archive = archiver('zip', {
    statConcurrency: 4,
    store: true
  })
  archive.on('warning', (err) => {
    console.error(err)
    throw err
  })
  archive.on('error', (err) => {
    console.error(err)
    throw err
  })
  res.status(200)
  res.header('Content-Type', 'application/zip')
  res.header('Content-Disposition', `attachment; filename="${album.name}.zip"`)
  archive.pipe(res)
  const limit = 256
  let skip = 0
  let files = []
  do {
    files = await Photo.find({ path: pathPrefixRegExp(album.path) }, Photo.projections.path({ includeId: true }), { limit, skip })
    files.forEach(file => {
      // photoDB.updateEventStat(id, 'served')
      archive.file(file.path, {
        name: file.path.substr(album.path.length)
      })
    })
    skip += limit
  } while (files?.length === limit)
  // albumDB.updateEventStat(id, 'served')
  archive.finalize()
})

$router.get('/photo/:id', async (req, res) => {
  const id = req.params.id
  if (!Photo.validateId(id)) {
    return res.status(400).end()
  }
  // defopts
  const fits = ['cover', 'contain', 'fill', 'inside', 'outside']
  const positions = ['center', 'top', 'right top', 'right', 'right bottom', 'bottom', 'left bottom', 'left', 'left top']
  // params
  let width = Math.min(Math.round(Math.abs(parseInt(req.query.w))), 3840) || undefined
  let height = Math.min(Math.round(Math.abs(parseInt(req.query.h))), 2160) || undefined
  const fit = fits.includes(req.query.f) ? req.query.f : fits[0]
  const position = positions.includes(req.query.p) ? req.query.p : positions[0]
  // const quality = 80 // Math.max(10, Math.min(parseInt(req.query.q) || 80, 100))
  // const progressive = !(['false', '0', 'off', ''].includes(req.query.r))
  // const sharpen = !(['false', '0', 'off', ''].includes(req.query.s)) && Math.min(width || 0, height || 0) <= 480
  //
  if (width === undefined && height === undefined) {
    width = 1200
    height = 900
  }
  //
  const opt = {
    resize: {
      width,
      height,
      fit,
      position,
      kernel: 'lanczos3',
      withoutEnlargement: true,
      fastShrinkOnLoad: true
    },
    sharpen: Math.min(width || 0, height || 0) <= 480,
    format: {
      type: 'jpeg', // req.headers.accept.includes('image/webp') ? 'webp' : 'jpeg',
      options: {
        quality: 80,
        progressive: true
      }
    }
  }
  // perf:start
  const t1 = Date.now()
  // lookup
  const serve = await Photo.findOne(id, Photo.projections.serve({ includeId: false }))
  if (!serve) return res.status(404).end()
  // headers
  res.header('Content-Disposition', `inline; filename="${serve.name}"`)
  res.contentType(`image/${opt.format.type}`)
  // cache tag
  const cacheTag = ((f, w, h, W, H, p) => {
    if (w === undefined) w = Math.round(h / H * W)
    if (h === undefined) h = Math.round(w / W * H)
    const wr = Math.round(h / H * W)
    const hr = Math.round(w / W * H)
    let wf = w
    let hf = h
    if (f === 'inside') {
      wf = Math.min(w, wr)
      hf = Math.min(h, hr)
    } else if (f === 'outside') {
      wf = Math.max(w, wr)
      hf = Math.max(h, hr)
    }
    return ['f', fits.indexOf(f), 'w', wf, 'h', hf, 'p', positions.indexOf(p)].join('')
  })(fit, width, height, serve.width, serve.height, position)
  // cache
  const cachedName = [id, cacheTag, 'jpg'].join('.')
  if (await FileCache.exists(cachedName)) {
    if (process.env.NODE_ENV !== 'production') {
      const t2 = Date.now(); console.log('cached', t2 - t1, cacheTag, id)
    }
    //    photoDB.updateEventStat(id, 'cached', cacheTag)
    //    photoDB.updateEventStat(id, 'served', cacheTag)
    return res.sendFile(await FileCache.locate(cachedName))
  }
  // load
  const fileData = (process.env.NODE_ENV === 'production')
    ? await fs.promises.readFile(serve.path)
    : await fs.promises.readFile(pathlib.join(__dirname, '../../photos-processor/test/dogs.jpg'))
  // convert
  let pipe = sharp(fileData, { failOnError: false })
    .rotate()
    .resize(opt.resize)
  if (opt.sharpen) pipe = pipe.sharpen()
  const imgBuff = await pipe
    .toFormat(opt.format.type, opt.format.options)
    .toBuffer()
  // store
  FileCache.createFile(cachedName, imgBuff)
  //  photoDB.updateEventStat(id, 'resized', cacheTag)
  if (process.env.NODE_ENV !== 'production') {
    const t2 = Date.now(); console.log('resize', t2 - t1, cacheTag, id)
  }
  // serve
  //  photoDB.updateEventStat(id, 'served', cacheTag)
  res.send(imgBuff)
})

$router.get('/photo/:id/original', async (req, res) => {
  const id = req.params.id
  if (!Photo.validateId(id)) {
    return res.status(400).end()
  }
  // lookup
  const serve = await Photo.findOne(id, Photo.projections.serve({ includeId: false }))
  if (!serve) return res.status(404).end()
  // stat
  //  Photo.updateEventStat(id, 'served', 'original')
  // serve
  res.header('Content-Disposition', `inline; filename="${serve.name}"`)
  res.status(200).sendFile(serve.path)
})

$router.get('/user/photo/:id', async (req, res) => {
  const id = req.params.id
  if (!User.validateId(id)) {
    return res.status(400).end()
  }
  // lookup
  const path = pathlib.join(config.api.profilePictures, `${id}.jpg`)
  // serve
  res.sendFile(path)
})

module.exports = {
  $router
}
