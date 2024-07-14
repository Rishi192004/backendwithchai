import { Router } from "express"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription} from "../controllers/subscription.controller.js";
const router=Router()

router.route("/getSubscribedChannels").get(verifyJWT,getSubscribedChannels);

router.route("/getUserChannelSubscribers").get(verifyJWT,getUserChannelSubscribers);

router.route("/toggleSubscription").post(verifyJWT,toggleSubscription);
export default router