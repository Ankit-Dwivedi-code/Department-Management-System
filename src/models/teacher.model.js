//create model for teacher
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const TeacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: 'teacher',
        enum: ['teacher'],
    },
    department: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    highestQualification: {
        type: String,
        required: true,
    },
    joiningDate: {
        type: Date,
        default: Date.now,
    },
    subjects: [{
        type: String,
    }],
    avatar: {
        type: String, // Cloudinary URL
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    refreshToken: {
        type: String,
    }
}, { timestamps: true });

// Pre-save middleware to hash password
TeacherSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to check if the password is correct
TeacherSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Method to generate access token
TeacherSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

// Method to generate refresh token
TeacherSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const Teacher = mongoose.model('Teacher', TeacherSchema);
