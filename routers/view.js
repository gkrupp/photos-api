const $router = require('express').Router()
const MongoDBService = require('../../photos-common/services/MongoDBService')
const Album = require('../../photos-common/models/album2')
const Photo = require('../../photos-common/models/photo2')
const User = require('../../photos-common/models/user2')
Album.init({ coll: MongoDBService.colls.albums })
Photo.init({ coll: MongoDBService.colls.photos })
User.init({ coll: MongoDBService.colls.users })

require('express-async-errors')
const { ApiError } = require('../../photos-common/errors')

const { getAlbum, getAlbumAlbums, getAlbumPhotos, getAlbumInfo, getAlbumUsers } = require('./album')

async function getViewAlbum (id, details = 'default', {
  includeId = true,
  infoSize = true, infoSpan = true,
  albumSort = 'name:1', photoSort = 'created:1', userSort = undefined,
  albumSkip = 0, photoSkip = 0, userSkip = 0,
  albumLimit = 200, photoLimit = 120, userLimit = 200
} = {}) {
  if (!Album.validateId(id)) {
    throw new ApiError({
      status: 400,
      message: 'Invalid \'albumId\'.'
    })
  }
  const albumOpts = { includeId, sort: albumSort, skip: albumSkip, limit: albumLimit }
  const photoOpts = { includeId, sort: photoSort, skip: photoSkip, limit: photoLimit }
  const userOpts = { includeId, sort: userSort, skip: userSkip, limit: userLimit }
  const infoOpts = { includeId, size: infoSize, span: infoSpan }
  // ret
  // albumDB.updateEventStat(albumId, 'viewed')
  return {
    album: await getAlbum(id, details, albumOpts),
    info: await getAlbumInfo(id, details, infoOpts),
    albums: await getAlbumAlbums(id, details, albumOpts),
    photos: await getAlbumPhotos(id, details, photoOpts),
    users: await getAlbumUsers(id, details, userOpts)
  }
}

$router.get('/album/:albumId', async (req, res) => {
  return res.json(await getViewAlbum(req.params.albumId, req.query.details || 'default', {
    includeId: true,
    albumSort: req.query.albumSort || 'name:1',
    albumSkip: parseInt(Number(req.query.albumSkip || 0)),
    albumLimit: Math.min(parseInt(Number(req.query.albumLimit || 0)) || 200, 200),
    photoSort: req.query.photoSort || 'created:1',
    photoSkip: parseInt(Number(req.query.photoSkip || 0)),
    photoLimit: Math.min(parseInt(Number(req.query.photoLimit || 0)) || 120, 120),
    userSort: req.query.userSort || undefined,
    userSkip: parseInt(Number(req.query.userSkip || 0)),
    userLimit: Math.min(parseInt(Number(req.query.userLimit || 0)) || 20, 20),
    infoSize: true,
    infoSpan: true
  }))
})

module.exports = {
  $router,
  getViewAlbum
}
