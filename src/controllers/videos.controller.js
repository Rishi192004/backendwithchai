import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js"; 
import { uploadOnCloudenary , extractPublicId , deleteFromCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js"

//frontend sai videos Id lena mt bhulna yaha pe
const addWatchedVideoInWatchHistory=asynchandler(async(req,res)=>{
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(400,"user not authenticated");
    }
    const { videoId } = req.body;
    if(!videoId){
        throw new APIError(400,"this video is not being watched")
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIError(404, "Video not found");
    }
    await User.findByIdAndUpdate(
        userId,
        { $addToSet: { watchHistory: videoId } },  // Adds videoId to watchHistory if not already present
        { new: true }  
    );
    return res.status(200).json(new ApiResponse(200, {}, "Video added to watch history"));
})




export { addWatchedVideoInWatchHistory }