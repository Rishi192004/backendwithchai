import { Router } from "express";
import {upload} from "../middleware/multer.middleware.js"
import {loginUser, logoutUser, registerUser,refreshAccessToken,changeCurrentPassword} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router=Router()

router.route("/register").post(
    //by this uload now i can upload 2 things on temp folder with there specific name,now what to upload is in logic part
    //of register of user
    //here first it goes to multer file and gets saved in local Directory as its a middleware,befre post
    upload.fields([
        {
            name:"avatar",
            //this name is to be passed to frontend engineer
            maxCount:1

        },{
            name:"coverImage",
            maxCount:1
           }
    ]),
    registerUser
)

router.route("/login").post(loginUser)


//secure routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refreshAccessToken").post(verifyJWT,refreshAccessToken)
router.route("/changeCurrentPassword").post(verifyJWT,changeCurrentPassword)


export default router