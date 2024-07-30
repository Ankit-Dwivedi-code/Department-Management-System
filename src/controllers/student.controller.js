import {asyncHandler} from '../utils/asyncHandler.js'
import { Student } from '../models/student.model.js';
import { ApiError } from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';
import { InviteCode } from '../models/invite.model.js';

const generateAccessAndRefreshTokens = async(studentId) =>{
    try {
        const student = await Student.findById(studentId)
        const accessToken =   student.generateAccessToken()
        const refreshToken = student.generateRefreshToken()

        student.refreshToken = refreshToken
        await student.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Internal server error while generating access and refresh token")
    }
}

const registerStudent = asyncHandler(async (req, res) => {
    // Get student details
    const { name, email, password, roll, uniqueCode, dateOfBirth, address, phone, year, fee,session, highestQualification, guardianDetails } = req.body;

    // Check for empty fields
    if (
        [name, email, password, roll, uniqueCode, dateOfBirth, address, phone, year, fee, session, highestQualification, guardianDetails].some((field) => !field)
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
        session,
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

const loginStudent = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
  
    // Check for empty fields
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }
  
    // Check for existing student
    const student = await Student.findOne({ email });
    if (!student) {
      throw new ApiError(401, "Invalid email or password");
    }
  
    // Check if the password is correct
    const isPasswordCorrect = await student.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid email or password");
    }
  
    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(student._id);
  
    // Save the refresh token to the database
    student.refreshToken = refreshToken;
    await student.save();
  
    const options = {
      httpOnly: true,
      secure: true, // Set to true if using HTTPS
    };
  
    // Send response with tokens
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, { accessToken, refreshToken }, "Student logged in successfully"));
  });

  const logoutStudent = asyncHandler(async (req, res) => {
    const studentId = req.student._id;
  
    // Find the student by ID and clear the refresh token
    const student = await Student.findById(studentId);
    if (!student) {
      throw new ApiError(400, "Student not found");
    }
  
    student.refreshToken = null;
    await student.save({ validateBeforeSave: false });
  
    // Clear the cookies containing the access and refresh tokens
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
  
    return res.status(200).json(new ApiResponse(200, {}, "Student logged out successfully"));
  });

  const renewRefreshToken = asyncHandler(async(req, res)=>{
    const token = req.cookies?.refreshToken || req.body.refreshToken
  
    try {
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
    
        if(!decodedToken){
            throw new ApiError(401, "Unauthorized request")
        }
    
        const student = await Student.findById(decodedToken._id)
    
        if(!student){
            throw new ApiError(401, "Inavild refresh Token")
        }
    
    
        if(token !== student.refreshToken){
            throw new ApiError(401, "Token doesnot match")
        }
    
        const {refreshToken, accessToken} = generateAccessAndRefreshTokens(student._id)
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, 
                {
                    accessToken,
                    refreshToken
                },
                "Refresh token updated"
            )
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid access token")
    }
  })

  const changeCurrentPassword = asyncHandler(async(req, res)=>{

    const {oldPassword, newPassword} = req.body
    
    if(!oldPassword || !newPassword){
        throw new ApiError(400, "Please provide old and new password")
    }
  
    // Find the student by ID
    const student = await Student.findById(req.student._id);
    if (!student) {
      throw new ApiError(400, "Student not found, please provide password correctly");
    }
  
     // Check if the old password is correct
     const isPasswordCorrect = await student.isPasswordCorrect(oldPassword);
     if (!isPasswordCorrect) {
       throw new ApiError(401, "Invalid old password");
     }
  
     student.password = newPassword
    await student.save({validateBeforeSave : false })
  
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
  })
  
  //to get the cureent student
  const getCurrentStudent = asyncHandler(async(req, res)=>{
    // console.log(req.student);
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.student, "Current student fetched successfully")
    )
  })

  const updateStudentAvatar = asyncHandler(async(req, res)=>{

    const avatarLocalPath = req.file.path;
    console.log(avatarLocalPath);
  
    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide the avatar")
    }
  
    const avatar =await uploadOnCloudinary(avatarLocalPath)
  
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }
  
    const student = await Student.findByIdAndUpdate(req.student?._id, 
        {
            $set:{
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")
  
    if(!student){
        throw new ApiError(400, "Student not found")
    }
  
    return res
    .status(200)
    .json(
        new ApiResponse(200, student, "File uploaded successfully")
    )
  })

  const updateStudentDetails = asyncHandler(async (req, res) => {
    const { name, email, phone, address, year, fee, session, highestQualification, dateOfBirth, guardianDetails, admissionDate } = req.body;
  
    // Check if at least one field is provided
    if (![name, email, phone, address, year, fee, session, highestQualification, dateOfBirth, guardianDetails, admissionDate].some(field => field)) {
      throw new ApiError(400, "Please provide at least one detail to update");
    }
  
    // Create an update object with only the fields that are provided
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (year) updateFields.year = year;
    if (fee) updateFields.fee = fee;
    if (highestQualification) updateFields.highestQualification = highestQualification;
    if (dateOfBirth) updateFields.dateOfBirth = dateOfBirth;
    if (guardianDetails) updateFields.guardianDetails = guardianDetails;
    if (admissionDate) updateFields.admissionDate = admissionDate;
    if (session) updateFields.session = session;
  
    // Update the student details
    const student = await Student.findByIdAndUpdate(req.student._id,
      {
        $set: updateFields
      },
      { new: true }
    ).select("-password");
  
    if (!student) {
      throw new ApiError(400, "Student not found");
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, student, "Student details updated successfully")
      );
  });

  const groupStudentsByYearAndSession = asyncHandler(async (req, res) => {
    const groupedStudents = await Student.aggregate([
        {
            $group: {
                _id: {
                    year: '$year',
                    session: '$session',
                },
                students: {
                    $push: {
                       _id: "$_id",
                        name: "$name",
                        email: "$email",
                        roll: "$roll",
                        phone: "$phone",
                        avatar: "$avatar",
                        session: "$session",
                    },
                },
            },
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.session': 1,
            },
        },
    ]);

    return res.status(200).json(new ApiResponse(200, groupedStudents, 'Students grouped successfully'));
});
export {registerStudent, loginStudent, logoutStudent, renewRefreshToken, changeCurrentPassword, getCurrentStudent, updateStudentAvatar, updateStudentDetails, groupStudentsByYearAndSession}