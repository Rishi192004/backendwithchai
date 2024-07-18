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

//by publishVideos i can test delete and add in watchHistory function 
const publishAVideo = asynchandler(async (req, res) => {
    const { title, description} = req.body

    //console.log(title)
    // TODO: get video, upload to cloudinary, create video


    if(!title || ! description){
        throw new APIError(400,"title or description is not entered")
    }


    const userId=req.user?._id;
    if(!userId){
        throw new APIError(400,"user not authenticated");
    }

    //console.log("userId->",userId)
    const user=await User.findById(userId);
    if(!user){
        throw new APIError(400,"user not found")
    }

    //console.log("user->",user)
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

//FRONTEND ENGINEER FIRSTS GETS THE VIDEO BY VIDEO ID AND FROM THERE CAN SEND ME CLOUDENARY LINK OF VIDEO
const deleteVideo = asynchandler(async (req, res) => {
    //REMEMBER THAT CLOUDENARYURL IS SENT ON BODY,AND VIDEOID ON PARAMS(URL FORM)
    //  get function for vide will be sent from where i can get url of cloudenary 
    const { videoId } = req.params
    const { cloudinaryUrl } = req.body;
    console.log("videoId:",videoId)
    console.log("cloudenaryURL:",cloudinaryUrl)
    if(!videoId || !cloudinaryUrl){
        throw new APIError(400,"from frontEnd either videoId or cloudenaryUrl has not come!!!")
    }
     
   // Assume you have a button to delete a video. When this button is clicked, you would make a DELETE request to 
   //your backend API with the video ID in the URL.
   const userId=req.user?._id;
   if(!userId){
    throw new APIError(400,"user not authenticated")
   }

    //not verifying user again as its already authenticated

   const video=await Video.findById(videoId);
   if(!video){
    throw new APIError(400,"video not found")
   }


   if(userId.toString()!==video.owner.toString()){
    throw new APIError(403, "You are not authorized to delete this video.")
   };


   const cloudenaryId=await extractPublicId(cloudinaryUrl)
    if(!cloudenaryId){
        throw new APIError(500,"Failed to extract Cloudinary ID from the URL")
    }


   try {
        await deleteFromCloudinary(cloudenaryId);
    } catch (error) {
        throw new APIError(500, "Failed to delete video from Cloudinary.");
    }



    await Video.findByIdAndDelete(videoId);


    return res.status(200).json(new ApiResponse(200,{},"Successfully deleted the video."))
})

const updateVideo = asynchandler(async (req, res) => {
    const { videoId, description, title } = req.body;
    if (!videoId || !description || !title) {
        throw new APIError(400, "videoId, description, and title are required");
    }
    
    const userId = req.user?._id;
    if (!userId) {
        throw new APIError(401, "User not authenticated");
    }
    
    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIError(402, "No video with specified videoId found");
    }
    
    if (video.owner.toString() !== userId.toString()) {
        throw new APIError(403, "User is not authorized to update this video");
    }

    video.title = title;
    video.description = description;
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Successfully updated title and description"));
});

const getVideoById=asynchandler(async(req,res)=>{
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(400,"user not authenticated")
    }
    const { videoId }=req.params;
    if(!videoId){
        throw new APIError(400,"videoId is required")
    }
    const video =await Video.findById(videoId);
    if(!video){
        throw new APIError(401,"no video by this video id")
    }
    return res.status(200).json(new ApiResponse(200,video,"video sent by videoId"))
})
//toggle isPublished
const toggleSubscription=asynchandler(async(req,res)=>{
    const user=req.user?._id;
    if(!user){
        throw new APIError(401,"user id not found")
    }
    const { videoId } = req.params;
    if(!videoId){
        throw new APIError(401,"videoId is required")
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new APIError(400,"video not found")
    }
    video.isPublished = !video.isPublished;
    await video.save();
    return res.status(200).json(new ApiResponse(200,video,"Successfully toggled publish status"))
})

const incViews=asynchandler(async(req,res)=>{
    const { videoId } =req.params;
    if(!videoId){
        throw new APIError(400,"videoId is required")
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new APIError(401,"video not found");
    }
    const views=await video.views;
    views=views+1;
    await video.save();
    return res.status(200).json(new ApiResponse(200,{},"views increased by 1"))
})//PUT OR PATCH METHOD USED


//YEH WALA CODE PHIR SAI DEKHO HAZAR BAAR DEKHO KUCH NAYA HAI,AND YEH SAHI HAI ISKA KOI GAURENTEE NHI HAI,REVISIT THE LOGIC

//bhai infinite scroll ka option daal dena ispe in frontend
const getAllVideos = asynchandler(async (req, res) => {
    const { page = 1, limit = 5, query = '', sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    // Validate page and limit
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    if (isNaN(pageNumber) || pageNumber <= 0) {
        throw new APIError(400, "Invalid page number");
    }
    if (isNaN(limitNumber) || limitNumber <= 0) {
        throw new APIError(400, "Invalid limit number");
    }

    // Validate sortBy and sortType
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'views', 'likes'];
    if (!validSortFields.includes(sortBy)) {
        throw new APIError(400, "Invalid sortBy field");
    }
    if (sortType !== 'asc' && sortType !== 'desc') {
        throw new APIError(400, "Invalid sortType value, should be 'asc' or 'desc'");
    }

    // Create a filter object
    const filter = {};

    // Add query filter if it exists
    if (query) {
        filter.title = { $regex: query, $options: 'i' }; // Case-insensitive regex search on title
    }

    // Add userId filter if it exists
    if (userId) {
        filter.owner = userId; // Assuming `owner` is the field for user ID in your Video model
    }

    // Set sorting order
    const sort = {};
    sort[sortBy] = sortType === 'asc' ? 1 : -1;

    // Fetch videos from the database
    const videos = await Video.find(filter)
        .sort(sort)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

    // Get the total count of videos matching the filter
    const totalVideos = await Video.countDocuments(filter);

    return res.status(200).json(new ApiResponse(200, {
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalVideos / limitNumber),
        totalVideos,
        videos
    }, "Sent all videos successfully"));
});

export { addWatchedVideoInWatchHistory, publishAVideo, deleteVideo, updateVideo, getVideoById,toggleSubscription,incViews,getAllVideos}