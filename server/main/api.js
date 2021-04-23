const express = require('express')
const apiRouter = express.Router()

const pool = require('./db')

apiRouter.get('/petitions', async (req, res) => {
  const searchQuery = req.query.search
  const loadMore = req.query.load
  let results = Number(loadMore) * 10
  if (results > 100) results = 100

  if (searchQuery === '' || searchQuery === undefined) {
    pool.query(
      `SELECT * FROM petitions ORDER BY date_created DESC LIMIT $1`,
      [results],
      (qErr, qRes) => {
        if (qErr) {
          throw qErr
        }
        res.json(qRes.rows)
      }
    )
  } else {
    pool.query(
      `SELECT * FROM petitions WHERE upper(concat(title, description, category)) LIKE upper('%' || $1 || '%') ORDER BY date_created DESC LIMIT $2`,
      [searchQuery, results],
      (qErr, qRes) => {
        if (qErr) {
          throw qErr
        }
        res.json(qRes.rows)
      }
    )
  }
})

apiRouter.get('/petition', (req, res) => {
  const { id } = req.query

  pool.query(`SELECT * FROM petitions WHERE id = $1`, [id], (qErr, qRes) => {
    if (qErr) {
      throw qErr
    }
    res.json(qRes.rows)
  })
})

module.exports = apiRouter
