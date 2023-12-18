require('dotenv').config;

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin@123',
    database: process.env.DB_NAME || 'mydb',
    connectionLimit: 10
}

module.exports = dbConfig;