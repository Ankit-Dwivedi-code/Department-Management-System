import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import {
    changeCurrentPassword,
    getCurrentTeacher,
    loginTeacher,
    logoutTeacher,
    registerTeacher,
    renewRefreshToken,
    updateTeacherAvatar,
    updateTeacherDetails
} from '../controllers/teacher.controller.js';
import { VerifyTeacher } from "../middleware/auth.middleware.js";

const router = Router();

// Register teacher
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        }
    ]),
    registerTeacher
);

// Login teacher
router.route("/log-in").post(loginTeacher);

// Logout teacher
router.route("/log-out").post(VerifyTeacher, logoutTeacher);

// Renew refresh token
router.route("/renew-refresh-token").post(VerifyTeacher, renewRefreshToken);

// Change current password
router.route("/change-password").post(VerifyTeacher, changeCurrentPassword);

// Get current teacher
router.route("/get-teacher").get(VerifyTeacher, getCurrentTeacher);

// Update teacher avatar
router.route("/update-avatar").patch(VerifyTeacher, upload.single("avatar"), updateTeacherAvatar);

// Update teacher details
router.route("/update-details").patch(VerifyTeacher, updateTeacherDetails);

export default router;
