import { Router } from "express"
import { upload } from "../middleware/multer.middleware.js" 
import { registerAdmin, loginAdmin, generateInviteCode } from "../controllers/admin.controller.js"

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
router.route("/generate-invite-code").post(generateInviteCode)

export default router