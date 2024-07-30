import { Router } from 'express';
import { getChatroomMessages, sendMessage } from '../controllers/chatroom.controller.js';
import { VerifyStudent, VerifyTeacher } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/:year/:session/messages').get(VerifyStudent, getChatroomMessages);
router.route('/:year/:session/messages').post(VerifyStudent, sendMessage);

export default router;
