const express = require('express')
const router = express.Router()

const apiRouter = require('./api')
router.use('/api', apiRouter)

router.get('/hello', (_, res) => {
  res.json('Hello world')
})

module.exports = router
