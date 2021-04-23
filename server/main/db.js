const { Pool } = require('pg')

const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'eprzymorze',
  password: 'postgres',
  port: 5432
})

module.exports = pool
