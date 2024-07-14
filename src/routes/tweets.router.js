import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { createTweet } from '../controllers/tweets.controller.js'
const router=Router();


router.route("/createTweet").post(verifyJWT,createTweet)



export default router;