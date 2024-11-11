// config/db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '0816792178zA@',
    database: 'testloginregister'
});

module.exports = connection;
