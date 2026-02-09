const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ridar_dummydiva',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function checkConnection() {
    try {
        const conn = await db.getConnection();
        console.log('db connect');
        conn.release();
    } catch (err) {
        console.error('db error', err.message);
    }
}

checkConnection();

module.exports = db;