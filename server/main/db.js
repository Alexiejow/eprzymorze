const { Pool } = require('pg')
require('dotenv').config()

const devConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
}

const proConfig = {
  connectionString: process.env.DATABASE_URL, // from heroku pg addon
  ssl: {
    required: true,
    rejectUnauthorized: false
  }
  // user: process.env.PG_USER,
  // host: process.env.PG_HOST,
  // database: process.env.PG_DATABASE,
  // password: process.env.PG_PASSWORD,
  // port: process.env.PG_PORT
}

const pool = new Pool(process.env.NODE_ENV === 'production' ? proConfig : devConfig)

module.exports = pool
