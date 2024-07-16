import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { APIError } from "../utils/APIError.js";
import { Like } from "../models/likes.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweets.model.js";

const toggleVideoLike = asynchandler(async (req, res) => {
    const { videoId } = req.params;
    const { likeStatus } = req.body;

    // Check for videoId
    if (!videoId) {
        throw new APIError(400, "No video Id found in params");
    }

    // Get userId from request
    const userId = req.user?._id;
    if (!userId) {
        throw new APIError(403, "User is not authenticated");
    }

    // Check if the video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIError(404, "Video not found");
    }

    // Toggle like status
    if (likeStatus === true) {
        // Check if the user already liked the video
        const alreadyLiked = await Like.findOne({ video: videoId, likedBy: userId });
        if (alreadyLiked) {
            throw new APIError(400, "User cannot like the video again");
        }

        // Create a new like
        const like = await Like.create({
            video: videoId,
            likedBy: userId
        });

        if (!like) {
            throw new APIError(500, "Something went wrong while liking the video");
        }

        return res.status(200).json(new ApiResponse(200, like, "The video is successfully liked"));

    } else if (likeStatus === false) {
        // Check if the user has liked the video
        const like = await Like.findOne({ video: videoId, likedBy: userId });

        if (!like) {
            throw new APIError(400, "User cannot dislike the video as it is not liked");
        }

        // Ensure the like belongs to the user
        if (userId.toString() !== like.likedBy.toString()) {
            throw new APIError(403, "This user is not authenticated to unlike this video");
        }

        // Remove the like
        await Like.findByIdAndDelete(like._id);

        return res.status(200).json(new ApiResponse(200, {}, "Successfully unliked the video"));
    } else {
        throw new APIError(400, "Invalid likeStatus provided");
    }
});

const toggleCommentLike = asynchandler(async (req, res) => {
    const {commentId} = req.params
    const { likeStatus } = req.body;

    // Check for videoId
    if (!commentId) {
        throw new APIError(400, "No comment Id found in params");
    }

    // Get userId from request
    const userId = req.user?._id;
    if (!userId) {
        throw new APIError(403, "User is not authenticated");
    }

    // Check if the comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new APIError(404, "comment not found");
    }

    // Toggle like status
    if (likeStatus === true) {
        // Check if the user already liked the comment
        const alreadyLiked = await Like.findOne({ comment: commentId, likedBy: userId });
        if (alreadyLiked) {
            throw new APIError(400, "User cannot like the comment again");
        }

        // Create a new like
        const like = await Like.create({
            comment: commentId,
            likedBy: userId
        });

        if (!like) {
            throw new APIError(500, "Something went wrong while liking the comment");
        }

        return res.status(200).json(new ApiResponse(200, like, "The comment is successfully liked"));

    } else if (likeStatus === false) {
        // Check if the user has liked the video
        const like = await Like.findOne({ comment: commentId, likedBy: userId });

        if (!like) {
            throw new APIError(400, "User cannot dislike the comment as it is not liked");
        }

        // Ensure the like belongs to the user
        if (userId.toString() !== like.likedBy.toString()) {
            throw new APIError(403, "This user is not authenticated to unlike this comment");
        }

        // Remove the like
        await Like.findByIdAndDelete(like._id);

        return res.status(200).json(new ApiResponse(200, {}, "Successfully unliked the comment"));
    } else {
        throw new APIError(400, "Invalid likeStatus provided");
    }

})

const toggleTweetLike=asynchandler(async(req,res)=>{
    const {tweetId} = req.params
    const { likeStatus } = req.body;

    // Check for videoId
    if (!tweetId) {
        throw new APIError(400, "No tweet Id found in params");
    }

    // Get userId from request
    const userId = req.user?._id;
    if (!userId) {
        throw new APIError(403, "User is not authenticated");
    }

    // Check if the comment exists
    const tweets = await Tweet.findById(tweetId);
    if (!tweets) {
        throw new APIError(404, "tweets not found");
    }

    // Toggle like status
    if (likeStatus === true) {
        // Check if the user already liked the comment
        const alreadyLiked = await Like.findOne({ tweet: tweetId, likedBy: userId });
        if (alreadyLiked) {
            throw new APIError(400, "User cannot like the tweet again");
        }

        // Create a new like
        const like = await Like.create({
            tweet: tweetId,
            likedBy: userId
        });

        if (!like) {
            throw new APIError(500, "Something went wrong while liking the tweet");
        }

        return res.status(200).json(new ApiResponse(200, like, "The tweet is successfully liked"));

    } else if (likeStatus === false) {
        // Check if the user has liked the video
        const like = await Like.findOne({ tweet: tweetId, likedBy: userId });

        if (!like) {
            throw new APIError(400, "User cannot dislike the tweet as it is not liked");
        }

        // Ensure the like belongs to the user
        if (userId.toString() !== like.likedBy.toString()) {
            throw new APIError(403, "This user is not authenticated to unlike this tweet");
        }

        // Remove the like
        await Like.findByIdAndDelete(like._id);

        return res.status(200).json(new ApiResponse(200, {}, "Successfully unliked the tweet"));
    } else {
        throw new APIError(400, "Invalid likeStatus provided");
    }

})

const getLikedVideos = asynchandler(async (req, res) => {
    //TODO: get all liked videos
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(403,"user is not authenticated")
    }
    const like=await Like.find({likedBy:userId})
    .populate({
        path:'video',
        select:'videoFile thumbNail title duration owner views',
        populate:{
            path:'owner',
            select:'username'
        }
    })
    .populate({
        path:'likedBy',
        select:'username avatar'
    })

    if(like.length===0){
        throw new APIError(404,"no liked videos found")
    }

    return res.status(200).json(new ApiResponse(like,"All liked videos are returned successfully"))

})

export {toggleVideoLike,toggleCommentLike,toggleTweetLike,getLikedVideos}