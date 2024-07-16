import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {addComment,updateComment,deleteComment,getVideoComments} from '../controllers/comments.controller.js'
const router=Router();

router.route("/addComment/:videoId").post(verifyJWT,addComment)
router.route("/updateComment/:commentId").patch(verifyJWT,updateComment)
router.route("/deleteComment/:commentId").delete(verifyJWT,deleteComment)
router.route("/getVideoComments/:videoId").get(verifyJWT,getVideoComments)

export default router