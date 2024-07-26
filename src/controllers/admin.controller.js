import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.model.js";
import { InviteCode } from "../models/invite.model.js";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    console.log("refresh Token is", refreshToken);

    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error while generating access and refresh token"
    );
  }
};

// Register Admin
const registerAdmin = asyncHandler(async (req, res) => {
  // Get admin details
  const { name, email, role, password, department, phone } = req.body;

  // Check for empty fields
  if (
    [name, email, password, role, department, phone].some((field) => !field)
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check for existing admin
  const existingAdmin = await Admin.findOne({ role });
  if (existingAdmin) {
    throw new ApiError(409, "Admin already exists");
  }

  // Check for avatar image
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  // Upload avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar image");
  }

  // Create new admin
  const admin = new Admin({
    name,
    email,
    password,
    role,
    department,
    phone,
    avatar: avatar.url,
  });

  // Save the new admin to the database
  await admin.save();

  // Remove sensitive data before sending the response
  const createdAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );

  if (!createdAdmin) {
    throw new ApiError(500, "Something went wrong in creating the admin");
  }

  // Send success response
  return res
    .status(201)
    .json(new ApiResponse(201, createdAdmin, "Admin registered successfully"));
});

// Admin Login
const loginAdmin = asyncHandler(async (req, res) => {
  // Get admin credentials
  const { email, password } = req.body;

  // Check for empty fields
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Check for existing admin
  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Check if the password is correct
  const isPasswordCorrect = await admin.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    admin._id
  );
  console.log(refreshToken);
  // Save the refresh token to the database
  admin.refreshToken = refreshToken;
  await admin.save();

  const options = {
    httpOnly: true,
    secure: true,
  };

  // Send response with tokens
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Admin logged in successfully"
      )
    );
});

const generateInviteCode = asyncHandler(async (req, res) => {
  const { role } = req.body;

  // Validate role
  const validRoles = ["teacher", "student"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  // Create a unique invite code
  const inviteCode = uuidv4();

  // Save the invite code to the database
  const invite = new InviteCode({
    code: inviteCode,
    role,
    used: false,
  });

  await invite.save();

  return res.status(201).json({
    success: true,
    message: "Invite code generated successfully",
    data: { inviteCode },
  });
});

// Admin Logout
const logoutAdmin = asyncHandler(async (req, res) => {
  //clear the cookie
  //clear rhe accesstoken
  await Admin.findByIdAndUpdate(
    req.admin._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Admin Logged out successfully"));
});

const renewRefreshToken = asyncHandler(async(req, res)=>{
  const token = req.cookies?.refreshToken || req.body.refreshToken

  try {
      const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
  
      if(!decodedToken){
          throw new ApiError(401, "Unauthorized request")
      }
  
      const admin = await Admin.findById(decodedToken._id)
  
      if(!admin){
          throw new ApiError(401, "Inavild refresh Token")
      }
  
  
      if(token !== admin.refreshToken){
          throw new ApiError(401, "Token doesnot match")
      }
  
      const {refreshToken, accessToken} = generateAccessAndRefreshTokens(admin._id)
  
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

  // Find the admin by ID
  const admin = await Admin.findById(req.admin._id);
  if (!admin) {
    throw new ApiError(400, "Admin not found, please provide password correctly");
  }

   // Check if the old password is correct
   const isPasswordCorrect = await admin.isPasswordCorrect(oldPassword);
   if (!isPasswordCorrect) {
     throw new ApiError(401, "Invalid old password");
   }

  admin.password = newPassword
  await admin.save({validateBeforeSave : false })

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
})

//to get the cureent admin
const getCurrentAdmin = asyncHandler(async(req, res)=>{
  // console.log(req.admin);
  return res
  .status(200)
  .json(
      new ApiResponse(200, req.admin, "Current user fetched successfully")
  )
})

const updateAdminAvatar = asyncHandler(async(req, res)=>{

  const avatarLocalPath = req.file.path;
  console.log(avatarLocalPath);

  if (!avatarLocalPath) {
      throw new ApiError(400, "Please provide the avatar")
  }

  const avatar =await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
      throw new ApiError(400, "Error while uploading on avatar")
  }

  const admin = await Admin.findByIdAndUpdate(req.admin?._id, 
      {
          $set:{
              avatar : avatar.url
          }
      },
      {new : true}
  ).select("-password")

  if(!admin){
      throw new ApiError(400, "Admin not found")
  }

  return res
  .status(200)
  .json(
      new ApiResponse(200, admin, "File uploaded successfully")
  )
})

const updateAdminDetails = asyncHandler(async(req, res)=>{

  const {name, email, phone} = req.body

  if(!name || !email || !phone){
      throw  new ApiError(400, "Please provide the details")
  }

  const admin = await Admin.findByIdAndUpdate(req.admin._id,
      {
          $set:{
              name,
              email,
              phone
          }
      },
      {new : true}
  ).select("-password")

  if(!admin){
      throw new ApiError(400, "Admin not found")
  }

  return res
  .status(200)
  .json(
      new ApiResponse(200, admin, "Admin details updated Successfully")
  )
})

export { registerAdmin, loginAdmin, generateInviteCode, logoutAdmin, renewRefreshToken, changeCurrentPassword, getCurrentAdmin, updateAdminAvatar, updateAdminDetails };
