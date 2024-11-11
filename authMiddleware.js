const jwt = require('jsonwebtoken');
const secret = 'Nut150945'; // ใช้ secret เดียวกับที่ใช้ใน login

function authenticateToken(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ status: 'error', message: 'No token provided' });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ status: 'error', message: 'Invalid token' });
        }
        req.user = user; // นำข้อมูลผู้ใช้ไปยัง route ถัดไป
        next(); // ส่งต่อไปยัง route ถัดไป
    });
}


module.exports = authenticateToken;
