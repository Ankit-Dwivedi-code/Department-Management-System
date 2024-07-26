import { Router } from "express"
import { upload } from "../middleware/multer.middleware.js" 
import { registerAdmin, loginAdmin, generateInviteCode, logoutAdmin, renewRefreshToken, changeCurrentPassword, getCurrentAdmin, updateAdminAvatar, updateAdminDetails } from "../controllers/admin.controller.js"
import { verifyAdmin } from "../middleware/auth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount:1,
        }
    ]),
    registerAdmin
)

router.route("/log-in").post(loginAdmin)

//Invite code route
router.route("/generate-invite-code").post(verifyAdmin, generateInviteCode)
//logout admin route
router.route("/log-out").post(verifyAdmin, logoutAdmin)
//Renew refresh Token
router.route("/renew-refresh-token").post(verifyAdmin, renewRefreshToken)
//Change current password
router.route("/change-password").post(verifyAdmin, changeCurrentPassword)
//Get currtent admin
router.route("/get-admin").get(verifyAdmin, getCurrentAdmin)
//Update Admin avatar
router.route("/update-avatar").patch(verifyAdmin,upload.single("avatar"), updateAdminAvatar)
//Update admin details
router.route("/update-details").patch(verifyAdmin, updateAdminDetails)




export default router