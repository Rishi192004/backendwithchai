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

const publishAVideo = asynchandler(async (req, res) => {
    const { title, description} = req.body

    
    // TODO: get video, upload to cloudinary, create video


    if(!title || ! description){
        throw new APIError(400,"title or description is not entered")
    }


    const userId=req.user?._id;
    if(!userId){
        throw new APIError(400,"user not authenticated");
    }


    const user=await User.findById(userId);
    if(!user){
        throw new APIError(400,"user not found")
    }


    const videoFileLocalPath=req.files?.videoFile[0]?.path;
    if(!videoFileLocalPath){
        throw new APIError(400,"video file not uploaded on local server")
    }


    const thumbNailLocalPath=req.files?.thumbNail[0]?.path;
    if(!thumbNailLocalPath){
        throw new APIError(400,"thumb nail file not uploaded on local server")
    }


    const videoFile=await uploadOnCloudenary(videoFileLocalPath);
    if(!videoFile){
        throw new APIError(500,"video file local path not uploaded on cloudenary")
    }


    const thumbNail=await uploadOnCloudenary(thumbNailLocalPath);
    if(!thumbNail){
        throw new APIError(500,"thumbnail local path not uploaded on cloudenary")
    }


    if(!videoFile.duration){
        throw new APIError(400,"duration is not defined in cloudenary response for video duration")
    }


    const video=await Video.create({
        videoFile:videoFile?.url,
        thumbNail:thumbNail?.url,
        title:title,
        description:description,
        duration:videoFile.duration,
        owner:userId
    })


    const videoConnect=await Video.findById(video._id).populate("owner","username")
    if(!videoConnect){
        throw new APIError(500,"something went wrong while uploading video")
    }


    return res.status(201).json(new ApiResponse(201,videoConnect,"video is succefully created and stored on database"));
    
})




export { addWatchedVideoInWatchHistory, publishAVideo }