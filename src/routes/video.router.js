import { Router } from "express";
import {upload} from "../middleware/multer.middleware.js"
import { addWatchedVideoInWatchHistory,publishAVideo,deleteVideo,updateVideo,getVideoById,toggleSubscription} from "../controllers/videos.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router=Router()



router.route("/addToWatcheHistory").get(verifyJWT,addWatchedVideoInWatchHistory)
router.route("/publishAVideo").post(verifyJWT,upload.fields([{name:"videoFile",maxCount:1},{name:"thumbNail",maxCount:1}]),publishAVideo)
router.route("/deleteVideo/:videoId").delete(verifyJWT,deleteVideo)
router.route("/updateVideo").patch(verifyJWT,updateVideo)
//I am not giving featue of updating thumbnail for now--->WILL CONSIDER LATER
router.route("/getVideoById").get(verifyJWT,getVideoById)

router.route("/toggle/publish/:videoId").patch(verifyJWT,toggleSubscription)


 


export default router