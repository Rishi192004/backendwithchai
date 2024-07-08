import { Router } from "express";
import {upload} from "../middleware/multer.middleware.js"
import { addWatchedVideoInWatchHistory,publishAVideo} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router=Router()



router.route("/addToWatcheHistory").get(verifyJWT,addWatchedVideoInWatchHistory)
router.route("/publishAVideo").post(upload.fields([{name:"videoFile",maxCount:1},{name:"thumbNail",maxCount:1}]),publishAVideo)







export default router