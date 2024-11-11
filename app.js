const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }  // ขีดจำกัดขนาดไฟล์ 10MB
});;
const authMiddleware = require('./authMiddleware');
const {
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

} = require('./controller/backed_config');

const app = express();
const jsonParser = bodyParser.json();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // ขนาดสูงสุดเป็น 10 MB
app.use(express.urlencoded({ limit: '10mb', extended: true }));


app.post('/reset-password', jsonParser, resetPassword);
app.post('/reset-password/:token', jsonParser, updatePassword);
app.post('/register', jsonParser, registerUser);
app.post('/login', jsonParser, loginUser);
app.post('/authen', jsonParser, authMiddleware, authenticate);
app.get('/protected', authMiddleware, protectedRoute);
app.post('/logout',jsonParser, logoutUser);
app.get('/user/profile', authMiddleware, userprofile);
app.post('/user/uploadprofile', authMiddleware, upload.single('profile_image'), uploadProfileImage);
app.put('/user/profile', authMiddleware, updateUserProfile);

app.listen(3333, function () {
    console.log('CORS-enabled web server listening on port 3333');
});
