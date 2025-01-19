import postgres from 'postgres'

const globalForPostgres = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined
}

const sql = globalForPostgres.sql ?? postgres({
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
    require: true
  },
  connect_timeout: 10
})

if (process.env.NODE_ENV !== 'production') globalForPostgres.sql = sql

export default sql