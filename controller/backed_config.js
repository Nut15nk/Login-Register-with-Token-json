const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const nodemailer = require('nodemailer');
const multer = require('multer');
const salt = bcrypt.genSaltSync(10);
const secret = 'Nut150945';

const storage = multer.memoryStorage(); // เก็บไฟล์ในหน่วยความจำ
const usedTokens = {};

// ฟังก์ชันการรีเซ็ตรหัสผ่าน


const resetPassword = (req, res) => {
    const { email } = req.body;
    db.execute(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, users) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Database error' });
            }
            if (users.length === 0) {
                return res.status(404).json({ status: 'error', message: 'User not found' });
            }
            // สร้าง token สำหรับรีเซ็ตรหัสผ่าน
            const token = jwt.sign({ email }, secret, { expiresIn: '10m' });

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'nakavat12@gmail.com',
                    pass: 'zjin ofau ozyx vvqu',
                },
            });
            const mailOptions = {
                from: 'nakavat12@gmail.com',
                to: email,
                subject: 'Reset Password',
                text: `Click the link to reset your password: http://localhost:3000/reset-password/${token}`,
            };
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    return res.status(500).json({ status: 'error', message: 'Failed to send email' });
                }
                res.json({ status: 'OK', message: 'Reset link sent to your email' });
            });
        }
    );
};


// ฟังก์ชันสำหรับรีเซ็ตรหัสผ่านโดยใช้โทเคน
const updatePassword = (req, res) => {
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
            return res.status(400).json({ message: 'Invalid token' });
        }

        const hashedPassword = await bcrypt.hash(password, salt);
        usedTokens[token] = true;

        db.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, decoded.email],
            (error, results) => {
                if (error) {
                    return res.status(500).json({ message: 'Database error' });
                }
                if (results.affectedRows === 0) {
                    return res.status(404).json({ message: 'User not found' });
                }
                res.json({ message: 'Password has been reset successfully' });
            }
        );
    });
};


// ฟังก์ชันสำหรับการลงทะเบียนผู้ใช้
const registerUser = (req, res) => {
    // ตรวจสอบว่าอีเมลมีอยู่ในฐานข้อมูลแล้วหรือไม่
    db.execute('SELECT * FROM users WHERE email = ?', [req.body.email], (err, result) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Error checking email existence' });
        }
        
        if (result.length > 0) {
            // ถ้ามีอีเมลนี้อยู่แล้วในฐานข้อมูล
            return res.status(400).json({ status: 'error', message: 'Email already exists' });
        }

        // สร้าง hash สำหรับรหัสผ่าน
        bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Error hashing password' });
            }

            // บันทึกข้อมูลผู้ใช้ใหม่ลงในฐานข้อมูล
            db.execute(
                'INSERT INTO users (email, password, fname, lname) VALUES (?, ?, ?, ?)',
                [req.body.email, hash, req.body.fname, req.body.lname],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ status: 'error', message: err });
                    }

                    // สร้าง JWT token หลังจากลงทะเบียนสำเร็จ
                    const token = jwt.sign({ id: result.insertId, email: req.body.email }, secret, { expiresIn: '5h' });
                    res.status(201).json({ status: 'OK', message: 'Registration successful', token });
                }
            );
        });
    });
};

// ฟังก์ชันสำหรับการเข้าสู่ระบบผู้ใช้
const loginUser = (req, res) => {
    db.execute(
        'SELECT * FROM users WHERE email = ?',
        [req.body.email],
        (err, users) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: err });
            }

            if (users.length === 0) {
                return res.status(401).json({ status: 'error', message: 'No user found' });
            }

            bcrypt.compare(req.body.password, users[0].password, (err, isLogin) => {
                if (err) {
                    return res.status(500).json({ status: 'error', message: err });
                }

                if (isLogin) {
                    // สร้าง JWT token หลังจากเข้าสู่ระบบสำเร็จ
                    const token = jwt.sign({ id: users[0].id, email: users[0].email }, secret, { expiresIn: '5h' });
                    // ส่ง token กลับไปให้ผู้ใช้
                    res.json({ status: 'OK', message: 'Login successful', token });
                } else {
                    res.status(401).json({ status: 'error', message: 'Login failed' });
                }
            });
        }
    );
};

const userprofile = (req, res) => {
    const userId = req.user.id;
    const query = 'SELECT id, fname, lname, profile_image FROM users WHERE id = ?';

    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];
        const userProfile = {
            id: user.id,
            fname: user.fname,
            lname: user.lname,
            profile_image: user.profile_image ? user.profile_image.toString('base64') : null
        };

        res.json({ user: userProfile });
    });
};

const updateUserProfile = (req, res) => {
    const userId = req.user.id;  // ใช้ userId จาก token ที่ authMiddleware ได้ตั้งไว้
    const { fname, lname } = req.body;  // รับค่า fname และ lname จาก request body

    // ตรวจสอบว่าผู้ใช้ส่งข้อมูล fname และ lname มาหรือไม่
    if (!fname || !lname) {
        return res.status(400).json({ message: 'First name and last name are required' });
    }

    // คำสั่ง SQL สำหรับการอัปเดตข้อมูล
    const query = 'UPDATE users SET fname = ?, lname = ? WHERE id = ?';

    db.query(query, [fname, lname, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Profile updated successfully' });
    });
};

const uploadProfileImage = (req, res) => {
    const userId = req.user.id;
    const image = req.file.buffer;

    // ตรวจสอบว่าผู้ใช้มีรูปโปรไฟล์หรือไม่
    const checkQuery = 'SELECT profile_image FROM users WHERE id = ?';
    db.query(checkQuery, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'ข้อผิดพลาดกับฐานข้อมูล', error: err });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }

        if (result[0].profile_image === null) {
            const insertQuery = 'UPDATE users SET profile_image = ? WHERE id = ?';
            db.query(insertQuery, [image, userId], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'ข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์', error: err });
                }
                res.json({ message: 'อัปโหลดรูปโปรไฟล์สำเร็จ' });
            });
        } else {
            const updateQuery = 'UPDATE users SET profile_image = ? WHERE id = ?';
            db.query(updateQuery, [image, userId], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'ข้อผิดพลาดในการอัปเดตรูปโปรไฟล์', error: err });
                }
                res.json({ message: 'อัปเดตรูปโปรไฟล์สำเร็จ' });
            });
        }
    });
};



const logoutUser = ( req, res ) => {
    res.clearCookie('token');
    res.status(200).json({ message:' Logout successful'});
}

// ฟังก์ชันการยืนยันตัวตน
const authenticate = (req, res) => {
    res.json({ status: 'ok', decoded: req.user });
};


// ฟังก์ชันการป้องกันเส้นทาง
const protectedRoute = (req, res) => {
    res.json({ status: 'OK', message: 'Access granted', user: req.user });
};



// ส่งออกฟังก์ชันทั้งหมด
module.exports = {
    resetPassword,
    updatePassword,
    registerUser,
    loginUser,
    authenticate,
    protectedRoute,
    logoutUser,
    uploadProfileImage,
    userprofile,
    updateUserProfile,
};
