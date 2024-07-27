import { asyncHandler } from '../utils/asyncHandler.js';
import { Teacher } from '../models/teacher.model.js';
import { ApiError } from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';

// Function to generate access and refresh tokens
const generateAccessAndRefreshTokens = async (teacherId) => {
    try {
        const teacher = await Teacher.findById(teacherId);
        const accessToken = teacher.generateAccessToken();
        const refreshToken = teacher.generateRefreshToken();

        teacher.refreshToken = refreshToken;
        await teacher.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Internal server error while generating access and refresh token");
    }
};

// Register a new teacher
const registerTeacher = asyncHandler(async (req, res) => {
    const { name, email, password, department, phone, highestQualification, address, subjects } = req.body;

    if ([name, email, password, department, phone, highestQualification, subjects].some(field => !field)) {
        throw new ApiError(400, 'All required fields must be provided');
    }

    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
        throw new ApiError(409, 'Teacher already exists');
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const avatar = avatarLocalPath ? await uploadOnCloudinary(avatarLocalPath) : null;

    const teacher = new Teacher({
        name,
        email,
        password,
        department,
        phone,
        highestQualification,
        address,
        subjects,
        avatar: avatar ? avatar.url : undefined
    });

    await teacher.save();

    const createdTeacher = await Teacher.findById(teacher._id).select('-password -refreshToken');

    return res.status(201).json(
        new ApiResponse(201, createdTeacher, 'Teacher registered successfully')
    );
});

// Login a teacher
const loginTeacher = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const teacher = await Teacher.findOne({ email });
    if (!teacher || !(await teacher.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid email or password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(teacher._id);

    teacher.refreshToken = refreshToken;
    await teacher.save();

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "Teacher logged in successfully"));
});

// Logout a teacher
const logoutTeacher = asyncHandler(async (req, res) => {
    const teacherId = req.teacher._id;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
        throw new ApiError(400, "Teacher not found");
    }

    teacher.refreshToken = null;
    await teacher.save({ validateBeforeSave: false });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json(new ApiResponse(200, {}, "Teacher logged out successfully"));
});

// Renew refresh token
const renewRefreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    try {
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        if (!decodedToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        const teacher = await Teacher.findById(decodedToken._id);

        if (!teacher || token !== teacher.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(teacher._id);

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "Refresh token updated"));
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid access token");
    }
});

// Change current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Please provide old and new password");
    }

    const teacher = await Teacher.findById(req.teacher._id);
    if (!teacher || !(await teacher.isPasswordCorrect(oldPassword))) {
        throw new ApiError(401, "Invalid old password");
    }

    teacher.password = newPassword;
    await teacher.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Get current teacher
const getCurrentTeacher = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.teacher, "Current teacher fetched successfully"));
});

// Update teacher avatar
const updateTeacherAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide the avatar");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const teacher = await Teacher.findByIdAndUpdate(req.teacher._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password");

    if (!teacher) {
        throw new ApiError(400, "Teacher not found");
    }

    return res.status(200).json(new ApiResponse(200, teacher, "Avatar updated successfully"));
});

// Update teacher details
const updateTeacherDetails = asyncHandler(async (req, res) => {
    const { name, email, phone, address, department, subjects, highestQualification } = req.body;

    if (![name, email, phone, address, department, subjects, highestQualification].some(field => field)) {
        throw new ApiError(400, "Please provide at least one detail to update");
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (department) updateFields.department = department;
    if (subjects) updateFields.subjects = subjects;
    if (highestQualification) updateFields.highestQualification = highestQualification;

    const teacher = await Teacher.findByIdAndUpdate(req.teacher._id,
        { $set: updateFields },
        { new: true }
    ).select("-password");

    if (!teacher) {
        throw new ApiError(400, "Teacher not found");
    }

    return res.status(200).json(new ApiResponse(200, teacher, "Teacher details updated successfully"));
});

export {
    registerTeacher,
    loginTeacher,
    logoutTeacher,
    renewRefreshToken,
    changeCurrentPassword,
    getCurrentTeacher,
    updateTeacherAvatar,
    updateTeacherDetails
};
