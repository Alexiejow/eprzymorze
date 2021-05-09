const express = require('express')
const router = express.Router()
require('dotenv').config()
const cors = require('cors')

const apiRouter = require('./api')
router.use('/api', apiRouter)
// router.use(cors())

// router.get('/', (_, res) => {
//   res.json('Hello world ' + process.env.DATABASE_URL)
// })

module.exports = router
