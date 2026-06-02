import { Router } from 'express';
import { askChatbot } from '../controllers/chat.controller.js';

const router = Router();

// Chatbot question endpoint (public access)
router.post('/', askChatbot);

export default router;
