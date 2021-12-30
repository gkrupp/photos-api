const $router = require('express').Router()

const MongoDBService = require('../../photos-common/services/MongoDBService')
const Photo = require('../../photos-common/models/photo2')
const Album = require('../../photos-common/models/album2')
Photo.init({ coll: MongoDBService.colls.photos })
Album.init({
  coll: MongoDBService.colls.albums,
  photo: Photo
})

require('express-async-errors')
const { ApiError } = require('../../photos-common/errors')

const { getUsers } = require('./user')

async function getAlbum (id, details = 'default', { includeId = false } = {}) {
  if (!Album.validateId(id)) {
    throw new ApiError({
      status: 400,
      message: 'Invalid \'albumId\'.'
    })
  }
  const aggrOpts = { includeId }
  const item = await Album.apiGet(id, details, aggrOpts, { one: true })
  if (!item) {
    throw new ApiError({
      status: 404,
      message: 'Album not found.'
    })
  }
  return item
}

async function getAlbumAlbums (id, details = 'default', { includeId = true, sort = 'name:1', skip = 0, limit = 1000 } = {}) {
  if (!Album.validateId(id)) {
    throw new ApiError({
      status: 400,
      message: 'Invalid \'albumId\'.'
    })
  }
  const aggrOpts = { includeId, sort, skip, limit }
  const items = await Album.apiGet({ albumId: id }, details, aggrOpts, { one: false })
  return {
    count: await Album.children(id, null, { count: true }),
    params: aggrOpts,
    items
  }
}

async function getAlbumPhotos (id, details = 'default', { includeId = true, sort = 'created:1', skip = 0, limit = 10000 } = {}) {
  if (!Album.validateId(id)) {
    throw new ApiError({
      status: 400,
      message: 'Invalid \'albumId\'.'
    })
  }
  const aggrOpts = { includeId, sort, skip, limit }
  const items = await Photo.apiGet({ albumId: id }, details, aggrOpts, { one: false })
  return {
    count: await Photo.children(id, null, { count: true }),
    params: aggrOpts,
    items
  }
}

async function getAlbumInfo (id, details = 'default', { includeId = false, size = true, span = true } = {}) {
  if (!Album.validateId(id)) {
    throw new ApiError({
      status: 400,
      message: 'Invalid \'albumId\'.'
    })
  }
  const album = await Album.findOne(id, Album.projections.path({ includeId: false }))
  if (album === null) {
    throw new ApiError({
      status: 404,
      message: 'Album not found.'
    })
  }
  const aggrOpts = { includeId, size, span }
  const info = await Photo.getPathPrefixInfo(album.path, aggrOpts)
  if (!info) {
    throw new ApiError({
      status: 404,
      message: 'Album not found.'
    })
  }
  if (includeId) {
    info.id = id
  }
  return info
}

async function getAlbumUsers (id, details = 'default', { includeId = true } = {}) {
  if (!Album.validateId(id)) {
    throw new ApiError({
      status: 400,
      message: 'Invalid \'albumId\'.'
    })
  }
  const album = await Album.findOne(id, Album.projections.path({ includeId: false }))
  if (album === null) {
    throw new ApiError({
      status: 404,
      message: 'Album not found.'
    })
  }
  const aggrOpts = { includeId }
  const albumUsersIds = await Album.getPathPrefixUsers(album.path)
  const photoUsersIds = await Photo.getPathPrefixUsers(album.path)
  const userIdSet = new Set()
  albumUsersIds.forEach(id => userIdSet.add(id))
  photoUsersIds.forEach(id => userIdSet.add(id))
  const userIds = Array.from(userIdSet.values())
  const items = await getUsers(userIds, details, aggrOpts)
  return {
    count: items.length,
    params: aggrOpts,
    items
  }
}

$router.get('/:id', async (req, res) => {
  return res.json(await getAlbum(req.params.id, req.query.details || 'default', {
    includeId: Boolean(req.query.includeId)
  }))
})
$router.get('/:id/albums', async (req, res) => {
  return res.json(await getAlbumAlbums(req.params.id, req.query.details || 'default', {
    includeId: true,
    sort: req.query.sort || 'name:1', // sorting is different for albums and photos
    skip: parseInt(Number(req.query.skip || 0)),
    limit: Math.min(parseInt(Number(req.query.limit || 0)) || 1000, 1000)
  }))
})
$router.get('/:id/photos', async (req, res) => {
  return res.json(await getAlbumPhotos(req.params.id, req.query.details || 'default', {
    includeId: true,
    sort: req.query.sort || 'created:1', // sorting is different for albums and photos
    skip: parseInt(Number(req.query.skip || 0)),
    limit: Math.min(parseInt(Number(req.query.limit || 0)) || 10000, 10000)
  }))
})
$router.get('/:id/info', async (req, res) => {
  return res.json(await getAlbumInfo(req.params.id, req.query.details || 'default', {
    includeId: Boolean(req.query.includeId),
    size: Boolean(req.query.size),
    span: Boolean(req.query.span)
  }))
})
$router.get('/:id/users', async (req, res) => {
  return res.json(await getAlbumUsers(req.params.id, req.query.details || 'default', {
    includeId: Boolean(req.query.includeId)
  }))
})

module.exports = {
  $router,
  getAlbum,
  getAlbumAlbums,
  getAlbumPhotos,
  getAlbumInfo,
  getAlbumUsers
}
