import {asyncHandler} from '../utils/asyncHandler.js'
import { Student } from '../models/student.model.js';
import { ApiError } from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';
import { InviteCode } from '../models/invite.model.js';

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken =   user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Internal server error while generating access and refresh token")
    }
}

const registerStudent = asyncHandler(async (req, res) => {
    // Get student details
    const { name, email, password, roll, uniqueCode, dateOfBirth, address, phone, year, fee, highestQualification, guardianDetails } = req.body;

    // Check for empty fields
    if (
        [name, email, password, roll, uniqueCode, dateOfBirth, address, phone, year, fee, highestQualification, guardianDetails].some((field) => !field)
    ) {
        throw new ApiError(400, 'All fields are required');
    }

    // Validate invite code
    const invite = await InviteCode.findOne({ code: uniqueCode, used: false });
    if (!invite) {
        throw new ApiError(400, 'Invalid or used invite code');
    }

    // Mark invite code as used
    invite.used = true;
    await invite.save();

    // Check for existing user
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
        throw new ApiError(409, 'Student already exists');
    }

    // Check for avatar image
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar image is required');
    }

    // Upload avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(400, 'Failed to upload avatar image');
    }

    // Create new student
    const student = new Student({
        name,
        email,
        password,
        roll,
        uniqueCode,
        dateOfBirth,
        address,
        phone,
        year,
        fee,
        highestQualification,
        guardianDetails,
        avatar: avatar.url,
    });

    // Save the new student to the database
    await student.save();

    // Remove sensitive data before sending the response
    const createdStudent = await Student.findById(student._id).select('-password -refreshToken');

    if (!createdStudent) {
        throw new ApiError(500, 'Something went wrong in creating the student');
    }

    // Send success response
    return res.status(201).json(
        new ApiResponse(201, createdStudent, 'Student registered successfully')
    );
});

export {registerStudent}