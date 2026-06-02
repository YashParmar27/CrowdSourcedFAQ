import { Router } from 'express';
import {
  getActivities,
  getActivityStats
} from '../controllers/activity.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, requireAdmin, getActivityStats);
router.get('/', authenticate, requireAdmin, getActivities);

export default router;
