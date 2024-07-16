import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { toggleVideoLike,toggleCommentLike,toggleTweetLike,getLikedVideos} from '../controllers/likes.controller.js'
const router=Router();

router.route("/toggleVideoLike/:videoId").post(verifyJWT,toggleVideoLike)
router.route("/toggleCommentLike/:commentId").post(verifyJWT,toggleCommentLike)
router.route("/toggleTweetLike/:tweetId").post(verifyJWT,toggleTweetLike)
router.route("/getLikedVideos").get(verifyJWT,getLikedVideos)

export default router