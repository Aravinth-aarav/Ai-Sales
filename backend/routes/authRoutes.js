import express from 'express';
import { authUser, registerUser, getUsers, deleteUser, refreshAccessToken } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', authUser);
router.post('/register', registerUser);
router.post('/refresh', refreshAccessToken);
router.route('/users').get(protect, getUsers);
router.route('/users/:id').delete(protect, deleteUser);

export default router;
