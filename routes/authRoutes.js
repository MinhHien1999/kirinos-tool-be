import express from 'express';
import {
  register,
  login,
  logout,
  refreshAccessToken,
  verifyToken,
} from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/refresh', refreshAccessToken);
router.get('/verify', authMiddleware, verifyToken);

export default router;
