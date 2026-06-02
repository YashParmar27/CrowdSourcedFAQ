import { Router } from 'express';
import {
  submitQuestion,
  getQuestions,
  getMyQuestions,
  updateQuestionStatus,
  groupQuestions,
  suggestFAQ,
  deleteQuestion
} from '../controllers/question.controller.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', optionalAuth, submitQuestion);
router.get('/my', authenticate, getMyQuestions);
router.get('/', authenticate, getQuestions);
router.patch('/:id/status', authenticate, requireAdmin, updateQuestionStatus);
router.post('/group', authenticate, requireAdmin, groupQuestions);
router.post('/suggest-faq', authenticate, requireAdmin, suggestFAQ);
router.delete('/:id', authenticate, requireAdmin, deleteQuestion);

export default router;