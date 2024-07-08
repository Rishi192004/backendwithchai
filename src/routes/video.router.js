import { Router } from "express";
import {upload} from "../middleware/multer.middleware.js"
import { addWatchedVideoInWatchHistory } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router=Router()



router.route("/addToWatcheHistory").get(verifyJWT,addWatchedVideoInWatchHistory)








export default router