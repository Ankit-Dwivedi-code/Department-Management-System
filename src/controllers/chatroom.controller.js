import { asyncHandler } from '../utils/asyncHandler.js';
import { Chatroom } from '../models/chatroom.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Get messages for a chatroom
const getChatroomMessages = asyncHandler(async (req, res) => {
    const { year, session } = req.params;

    const chatroom = await Chatroom.findOne({ year, session }).populate('messages.sender');
    if (!chatroom) {
        throw new ApiError(404, 'Chatroom not found');
    }

    return res.status(200).json(new ApiResponse(200, chatroom.messages, 'Messages fetched successfully'));
});

// Send a message
const sendMessage = asyncHandler(async (req, res) => {
    const { year, session } = req.params;
    const { sender, senderModel, content, type } = req.body;

    let chatroom = await Chatroom.findOne({ year, session });
    if (!chatroom) {
        chatroom = new Chatroom({ year, session, participants: [], messages: [] });
    }

    const newMessage = { sender, senderModel, content, type };
    chatroom.messages.push(newMessage);

    await chatroom.save();

    return res.status(201).json(new ApiResponse(201, chatroom, 'Message sent successfully'));
});

export { getChatroomMessages, sendMessage };
