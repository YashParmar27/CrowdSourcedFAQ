import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createDiscussion,
  listDiscussions,
  getDiscussion,
  createReply,
  voteReply
} from '../controllers/discussion.controller.js';

const router = Router();

router.post('/', authenticate, createDiscussion);
router.get('/', authenticate, listDiscussions);
router.get('/:id', authenticate, getDiscussion);
router.post('/:id/replies', authenticate, createReply);
router.post('/replies/:id/vote', authenticate, voteReply);

export default router;
