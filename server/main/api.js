const express = require('express')
const apiRouter = express.Router()
const generatePassword = require('password-generator')
const sendEmail = require('./email-send')

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

apiRouter.get('/signatures', (req, res) => {
  if (req.query.id === 'all') {
    const { email } = req.query
    pool.query(
      `SELECT petition_id FROM signatures WHERE email = $1 AND confirmation = 'confirmed';`,
      [email],
      (qErr, qRes) => {
        if (qErr) {
          throw qErr
        }
        res.json(qRes.rows)
      }
    )
  } else {
    const { id, email } = req.query

    pool.query(
      `SELECT * FROM signatures WHERE petition_id = $1 AND email = $2;`,
      [id, email],
      (qErr, qRes) => {
        if (qErr) {
          throw qErr
        }
        res.json(qRes.rowCount)
      }
    )
  }
})

apiRouter.post('/petition/sign', (req, res) => {
  const { name, email } = req.body
  const petitionId = Number(req.body.petitionId)

  console.log(`${petitionId} ${name} ${email}`)

  const confirmationKey = generatePassword(20, false)

  sendEmail(email, petitionId, confirmationKey)

  pool.query(
    `INSERT INTO signatures (petition_id, name, email, confirmation, date_signed) VALUES ($1, $2, $3, $4, NOW());`,
    [petitionId, name, email, confirmationKey],
    (qErr, qRes) => {
      if (qErr) {
        throw qErr
      }
      res.json(qRes.rows)
    }
  )
})

apiRouter.post('/petition/create', (req, res) => {
  const { title, description, category, photo, creatorName, creatorEmail, signaturesGoal } = req.body
  const values = [title, description, category, photo, creatorName, creatorEmail, signaturesGoal]

  // pool.query(`INSERT INTO signatures (petition_id, email, name, date_signed, confirmation) VALUES ($1, $2, $3, NOW(), 'confirmed')`, )

  pool.query(`INSERT INTO petitions (title, description, category, photo, creator_name, creator_email, signatures_goal, date_created) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`, values,
  (qErr, qRes) => {
    if (qErr) {
      throw qErr
    }
    res.json(qRes)
  })
})

apiRouter.post('/confirm', (req, res) => {
  const { key, id } = req.query

  if (key !== undefined) {
    pool.query(`SELECT * FROM signatures WHERE confirmation = $1`, [key], (qErr, qRes) => {
      if (qErr) {
        throw qErr
      }
      else if (qRes.rowCount === 1) {
        pool.query(`UPDATE signatures SET confirmation = 'confirmed' WHERE confirmation = $1`, [key], (qErr1, qRes1) => {
          if (qErr1) {
            throw qErr1
          }
          pool.query(`UPDATE petitions SET signatures = signatures + 1 WHERE id = $1`, [id], (qErr2, qRes2) => {
            if (qErr2) {
              throw qErr2
            }
            res.json(`success`)
          })
        })
      } else {
        res.json('failure')
      }
    })
  }
})

module.exports = apiRouter
