import { Router } from "express"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createPlaylist } from "../controllers/playList.controller.js"
const router=Router()

router.route("/createPlaylist").post(verifyJWT,createPlaylist)

export default router;