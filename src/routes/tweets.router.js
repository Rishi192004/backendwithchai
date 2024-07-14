import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { createTweet,getUserTweets,updateTweet,deleteTweet } from '../controllers/tweets.controller.js'
const router=Router();


router.route("/createTweet").post(verifyJWT,createTweet)
router.route("/getUserTweets/:userId").get(verifyJWT,getUserTweets)
router.route("/updateTweet/:tweetId").post(verifyJWT,updateTweet)
router.route("/deleteTweet/:tweetId").post(verifyJWT,deleteTweet)

export default router;