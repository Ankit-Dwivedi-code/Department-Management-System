import { Router } from "express"
import { upload } from "../middleware/multer.middleware.js" 
import {registerStudent} from '../controllers/student.controller.js'

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

export default router