import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login.js';
import Home from './home.js';
import Register from './Registration.js';
import RequestResetPassword from './RequestResetPassword.js'; // นำเข้า RequestResetPassword
import ResetPassword from './ResetPassword.js'; // นำเข้า ResetPassword

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/request-reset-password" element={<RequestResetPassword />} /> {/* เส้นทางใหม่ */}
            <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
    </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
