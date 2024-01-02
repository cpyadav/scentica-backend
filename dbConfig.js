require('dotenv').config;

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'dev',
    password: process.env.DB_PASSWORD || 'dev@123',
    database: process.env.DB_NAME || 'scentia',
    connectionLimit: 10
}

module.exports = dbConfig;