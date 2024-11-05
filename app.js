// เพิ่มการนำเข้าโมดูลที่จำเป็น
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const authMiddleware = require('./authMiddleware');
const usedTokens = {};
const app = express();
const jsonParser = bodyParser.json();
const salt = bcrypt.genSaltSync(10);
const secret = 'Nut150945';

// ตั้งค่าการเชื่อมต่อ MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'database'
});

// ตั้งค่า nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'youremail@gmail.com', // ใช้อีเมลจริงของคุณ
        pass: 'genpass', // รหัสผ่านของอีเมลจริงของคุณ
    },
});

app.use(cors());
app.use(express.json());

// ฟังก์ชันการรีเซ็ตรหัสผ่าน
app.post('/reset-password', jsonParser, function (req, res) {
    
    const { email } = req.body;

    connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [email],
        function (err, users) {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
            if (users.length === 0) {
                return res.status(404).json({ status: 'error', message: 'User not found' });
            }

            // สร้าง token สำหรับรีเซ็ตรหัสผ่าน
            const token = jwt.sign({ email }, secret, { expiresIn: '10m' });

            const mailOptions = {
                from: 'youremail@gmail.com', // ใช้อีเมลจริงของคุณ
                to: email,
                subject: 'Reset Password',
                text: `Click the link to reset your password: http://localhost:3000/reset-password/${token}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({ status: 'error', message: 'Failed to send email' });
                }
                res.json({ status: 'OK', message: 'Reset link sent to your email' });
            });
        }
    );
});
// ฟังก์ชันสำหรับรีเซ็ตรหัสผ่านโดยใช้โทเคน
app.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }
    if (usedTokens[token]) {
        return res.status(400).json({ message: 'Token has already been used' });
    }
    jwt.verify(token, secret, async (err, decoded) => {
        if (err) {
            console.error("Token verification error:", err);
            return res.status(400).json({ message: 'Invalid token' });
        }
        const hashedPassword = await bcrypt.hash(password, salt);
        usedTokens[token] = true;
        console.log("Hashed Password:", hashedPassword);
        connection.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, decoded.email],
            (error, results) => {
                if (error) {
                    console.error("Database update error:", error);
                    return res.status(500).json({ message: 'Database error' });
                }
                if (results.affectedRows === 0) {
                    return res.status(404).json({ message: 'User not found' });
                }
                res.json({ message: 'Password has been reset successfully' });
            }
        );
    });
});



// ส่วนที่เหลือของโค้ด...
app.post('/register', jsonParser, function (req, res) {
    bcrypt.hash(req.body.password, salt, function (err, hash) {
        connection.execute(
            'INSERT INTO users (email, password, fname, lname) VALUES (?, ?, ?, ?)',
            [req.body.email, hash, req.body.fname, req.body.lname],
            function (err) {
                if (err) {
                    res.json({ status: 'error', message: err });
                    return;
                }
                res.json({ status: 'OK' });
            }
        );
    });
});

app.post('/login', jsonParser , function (req, res, next) {
    connection.execute(
        'SELECT * FROM users WHERE email=?',
        [req.body.email],
        function (err, users, fields) {
            if (err) { 
                res.status(500).json({status: 'error', message: err}); 
                return; 
            }
            if (users.length === 0) {
                res.status(401).json({status: 'error', message: 'no user found'}); 
                return; 
            } 
            bcrypt.compare(req.body.password, users[0].password, function(err, isLogin){
                if (err) { 
                    res.status(500).json({status: 'error', message: err}); 
                    return; 
                }
                if (isLogin){
                    var token = jwt.sign({ email: users[0].email }, secret, { expiresIn: '1h' });
                    res.json({status: 'OK', message: 'login success', token});
                } else {
                    res.status(401).json({status: 'error', message: 'login failed'});
                }
            });
        }
    );
});

// ใช้ middleware สำหรับเส้นทางที่ต้องการการตรวจสอบ
app.post('/authen', jsonParser, authMiddleware, function (req, res) {
    res.json({ status: 'ok', decoded: req.user });
});

// เส้นทางที่ต้องการการป้องกัน
app.get('/protected', authMiddleware, function (req, res) {
    res.json({ status: 'OK', message: 'Access granted', user: req.user });
});

app.listen(3333, function () {
    console.log('CORS-enabled web server listening on port 3333');
});
