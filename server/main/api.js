const express = require('express')
const apiRouter = express.Router()
const generatePassword = require('password-generator')
const sendEmail = require('./email-send')
const cors = require('cors')

const pool = require('./db')

console.log('in api.js, before cors')

// apiRouter.use(cors())

// apiRouter.use(function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*')
//   res.header('Access-Control-Allow-Credentials', true)
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json'
//   )
//   next()
// })

console.log('in api.js, after cors')

apiRouter.get('/pool', (_, res) => {
  res.json(pool)
})

apiRouter.get('/test', async (req, res) => {
  pool.connect((err, client, done) => {
    if (err) throw err
    client.query('SELECT * FROM petitions', (err, res) => {
      done()
      if (err) {
        console.log(err.stack)
      } else {
        console.log(res.rows[0])
      }
    })
  })
})

apiRouter.get('/petitions', async (req, res) => {
  const searchQuery = req.query.search
  const loadMore = req.query.load

  let area = ''
  req.query.area ? area = `recipient='${req.query.area}'` : area = ''
  let view = ''
  if (Number(req.query.view) === 1) view = 'status IS NOT NULL'
  else if (Number(req.query.view) === 2) view = 'signatures >= signatures_goal'
  let filterQuery = ''
  if (view) {
    if (area) {
      filterQuery = `WHERE ${area} AND ${view}`
    } else {
      filterQuery = `WHERE ${view}`
    }
  } else if (area) {
    filterQuery = `WHERE ${area}`
  }

  console.log(`area: ${area}`)
  console.log(`filter query: ${filterQuery}`)

  let results = Number(loadMore) * 10
  if (results > 100) results = 100 

  if ((searchQuery === '' || searchQuery === undefined)) {
    pool.query(
      `SELECT * FROM petitions ${filterQuery} ORDER BY date_created DESC LIMIT $1`,
      [results],
      (qErr, qRes) => {
        if (qErr) {
          throw qErr
        }
        res.json(qRes.rows)
      }
    )
  } else {
    filterQuery ? filterQuery = `${filterQuery} AND upper(concat(title, description, creator_name)) LIKE upper('%' || $1 || '%')` : filterQuery = `WHERE upper(concat(title, description, creator_email)) LIKE upper('%' || $1 || '%')`
    pool.query(
      `SELECT * FROM petitions ${filterQuery} ORDER BY date_created DESC LIMIT $2`,
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
  } else if (req.query.email === undefined && req.query.id) {
    const { id } = req.query
    pool.query(
      `SELECT * FROM signatures WHERE petition_id = $1 AND confirmation = 'confirmed' ORDER BY date_signed DESC LIMIT 10;`,
      [id],
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
  const { name, email, message } = req.body
  const petitionId = Number(req.body.petitionId)

  console.log(`${petitionId} ${name} ${email}`)

  const confirmationKey = generatePassword(20, false)

  sendEmail(email, petitionId, confirmationKey)

  pool.query(
    `INSERT INTO signatures (petition_id, name, email, message, confirmation, date_signed) VALUES ($1, $2, $3, $4, $5, NOW());`,
    [petitionId, name, email, message, confirmationKey],
    (qErr, qRes) => {
      if (qErr) {
        throw qErr
      }
      res.json(qRes.rows)
    }
  )
})

apiRouter.post('/petition/create', (req, res) => {
  const {
    title,
    description,
    photo,
    creatorName,
    creatorEmail,
    signaturesGoal,
    recipient
  } = req.body
  const values = [
    title,
    description,
    photo,
    creatorName,
    creatorEmail,
    signaturesGoal,
    recipient
  ]

  // pool.query(`INSERT INTO signatures (petition_id, email, name, date_signed, confirmation) VALUES ($1, $2, $3, NOW(), 'confirmed')`, )

  pool.query(
    `INSERT INTO petitions (title, description, photo, creator_name, creator_email, signatures_goal, recipient, date_created) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING petitions.id`,
    values,
    (qErr, qRes) => {
      if (qErr) {
        throw qErr
      }
      pool.query(
        `INSERT INTO signatures (petition_id, email, name, date_signed, confirmation) VALUES ($1, $2, $3, NOW(), 'confirmed')`,
        [qRes.rows[0].id, creatorEmail, creatorName],
        (qErr1, qRes1) => {
          if (qErr1) {
            throw qErr1
          }
          // res.json({ qRes, qRes1 })
          res.json('success')
        }
      )
    }
  )
})

apiRouter.post('/confirm', (req, res) => {
  const { key, id } = req.query

  if (key !== undefined) {
    pool.query(
      `SELECT * FROM signatures WHERE confirmation = $1`,
      [key],
      (qErr, qRes) => {
        if (qErr) {
          throw qErr
        } else if (qRes.rowCount === 1) {
          pool.query(
            `UPDATE signatures SET confirmation = 'confirmed' WHERE confirmation = $1`,
            [key],
            (qErr1, qRes1) => {
              if (qErr1) {
                throw qErr1
              }
              pool.query(
                `UPDATE petitions SET signatures = signatures + 1 WHERE id = $1`,
                [id],
                (qErr2, qRes2) => {
                  if (qErr2) {
                    throw qErr2
                  }
                  res.json(`success`)
                }
              )
            }
          )
        } else {
          res.json('failure')
        }
      }
    )
  }
})

apiRouter.patch('/review', (req, res) => {
  const {
    status, response, id
  } = req.body

  pool.query(
    `UPDATE petitions SET status = $1, response = $2 WHERE id = $3`,
    [status, response, id],
    (qErr, qRes) => {
      if (qErr) {
        throw qErr
      }
      res.json(status)
    }
  )
})

apiRouter.get('/checkrole', (req, res) => {
  const { email, role } = req.query
  pool.query(
    `SELECT * FROM roles WHERE email=$1 AND role=$2;`, [email, role],
    (qErr, qRes) => {
      if (qErr) {
        throw qErr
      }
      res.json(qRes.rowCount)
    }
  )
})

apiRouter.get('/visions', (_, res) => {
  pool.query(
    `SELECT photo, location, date_created FROM urban_visions ORDER BY date_created DESC`,
    (qErr, qRes) => {
      if (qErr) {
        throw qErr
      }
      res.json(qRes.rows)
    }
  )
})

apiRouter.post('/vision/create', (req, res) => {
  const { base64 } = req.body

  pool.query(
    `INSERT INTO urban_visions (photo, location, date_created) VALUES ($1, $2, NOW())`,
    [base64, 'test'],
    (qErr, qRes) => {
      if (qErr) {
        throw qErr
      }
      res.json('success')
    }
  )
})

module.exports = apiRouter
