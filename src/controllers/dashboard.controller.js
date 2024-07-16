import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { APIError } from "../utils/APIError.js";
import { Like } from "../models/likes.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweets.model.js";
import { playList } from "../models/playList.model.js";
import { User } from "../models/user.model.js";
import { subscription } from "../models/subscription.model.js";


//videos which the user has made
const getChannelStats = asynchandler(async (req, res) => {
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(403,"user is not authenticated");
    }
    //no need for watch history
    const user=await User.findById(userId);

    if(!user){
        throw new APIError(404,"no user with given userId found")
    }
    
    const videoCount=await Video.countDocuments({owner:userId});
    
    const SubCount=await subscription.countDocuments({channel:userId});

    const subsToCount = await subscription.countDocuments({subscriber:userId});

    //can display playlist formed by user
    const UserplayListCount=await playList.countDocuments({owner:userId});

    // i can fetch and display tweet if needed from tweet controller getTweet wala controller
    const tweetCount=await Tweet.countDocuments({owner:userId});

    const commentCount=await Comment.countDocuments({owner:userId});

    return res.status(200).json(new ApiResponse(200,{user,videoCount,SubCount,subsToCount,UserplayListCount,tweetCount,commentCount},"all dashboard essential returned"));

});

const getChannelVideos = asynchandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(403,"user is not authenticated")
    }

     const video=await Video.find({owner:userId}).populate({
        path:'owner',
        select:'username avatar'
    });
    if(video.length===0){
        throw new APIError(404,"no video is published by user")
    }

    return res.status(200).json(new ApiResponse(200,video,"all channel videos sent"))
})

export{getChannelStats,getChannelVideos}