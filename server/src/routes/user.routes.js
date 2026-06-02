import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  checkUsername
} from '../controllers/user.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/check-username/:username', checkUsername);
router.get('/stats', authenticate, requireAdmin, getUserStats);
router.get('/:id', authenticate, getUserById);
router.get('/', authenticate, requireAdmin, getAllUsers);
router.put('/:id', authenticate, requireAdmin, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;