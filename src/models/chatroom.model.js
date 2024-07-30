import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'senderModel' }, // Refer to either Student, Teacher, or Admin
    senderModel: { type: String, required: true, enum: ['Student', 'Teacher', 'Admin'] },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image'], default: 'text' },
    timestamp: { type: Date, default: Date.now }
});

const chatroomSchema = new mongoose.Schema({
    year: { type: String, enum: ['1st Year', '2nd Year', '3rd Year'], required: true },
    session: { type: String, required: true },
    messages: [messageSchema],
    participants: [{ type: mongoose.Schema.Types.ObjectId, refPath: 'participantModel' }],
    participantModel: { type: String, default : 'Student', required: true, enum: ['Student', 'Teacher', 'Admin'] },
});

export const Chatroom = mongoose.model('Chatroom', chatroomSchema);


