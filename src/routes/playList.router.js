import { Router } from "express"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createPlaylist,addVideoToPlaylist } from "../controllers/playList.controller.js"
const router=Router()

router.route("/createPlaylist").post(verifyJWT,createPlaylist)
router.route("/addVideoToPlaylist/:playlistId/:videoId").post(verifyJWT,addVideoToPlaylist)
export default router;