const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authMiddleware = require('./authMiddleware');
const {
    resetPassword,
    updatePassword,
    registerUser,
    loginUser,
    authenticate,
    protectedRoute
} = require('./controller/backed_config');

const app = express();
const jsonParser = bodyParser.json();

app.use(cors());
app.use(express.json());

app.post('/reset-password', jsonParser, resetPassword);
app.post('/reset-password/:token', jsonParser, updatePassword);
app.post('/register', jsonParser, registerUser);
app.post('/login', jsonParser, loginUser);
app.post('/authen', jsonParser, authMiddleware, authenticate);
app.get('/protected', authMiddleware, protectedRoute);


app.listen(3333, function () {
    console.log('CORS-enabled web server listening on port 3333');
});
