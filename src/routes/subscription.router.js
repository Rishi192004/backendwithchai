import { Router } from "express"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getSubscribedChannels } from "../controllers/subscription.controller.js";
const router=Router()

router.route("/getSubscribedChannels").get(verifyJWT,getSubscribedChannels)

export default router