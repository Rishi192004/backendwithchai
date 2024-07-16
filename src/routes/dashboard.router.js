import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {getChannelStats,getChannelVideos} from'../controllers/dashboard.controller.js';
const router=Router();

router.route("/getChannelStats").get(verifyJWT,getChannelStats)
router.route("/getChannelVideos").get(verifyJWT,getChannelStats)


export default router