import { Router } from "express"
import { upload } from "../middleware/multer.middleware.js" 
import {changeCurrentPassword, getCurrentStudent, groupStudentsByYearAndSession, loginStudent, logoutStudent, registerStudent, renewRefreshToken, updateStudentAvatar, updateStudentDetails} from '../controllers/student.controller.js'
import { VerifyStudent } from "../middleware/auth.middleware.js"

const router = Router()


router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount:1,
        }
    ]),
    registerStudent
)

//login student
router.route("/log-in").post(loginStudent)
//logout Student
router.route("/log-out").post(VerifyStudent, logoutStudent)
//renew refresh token
router.route("/renew-refresh-token").post(VerifyStudent, renewRefreshToken)
//Change current password
router.route("/change-password").post(VerifyStudent, changeCurrentPassword)
//Get currtent student
router.route("/get-student").get(VerifyStudent, getCurrentStudent)
//Update Student avatar
router.route("/update-avatar").patch(VerifyStudent,upload.single("avatar"), updateStudentAvatar)
//Update Student details
router.route("/update-details").patch(VerifyStudent, updateStudentDetails)
// Group students by year and session
router.route('/group-students').get(VerifyStudent, groupStudentsByYearAndSession);


export default router