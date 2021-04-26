const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'eprzymorze',
  password: 'postgres',
  port: 5432
})

module.exports = pool
