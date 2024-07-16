import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { APIError } from "../utils/APIError.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";


const addComment = asynchandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId}=req.params;
    const {content}=req.body;
    if(!videoId || !content){
        throw new APIError(400,"videoId or comment is not there in params/body")
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new APIError(404,"no video with given videoId found");
    }
    const userid=req.user?._id;
    if(!userid){
        throw new APIError(403,"the user is not authenticated")
    }
    //when it is created then i can send a get function and fetch the owner's username to dispaly on comments
    const comment=await Comment.create({
        content:content,
        video:videoId,
        owner:userid
    })
    if(!comment){
        throw new APIError(500,"comment cannot be added due to some internal error")
    }

    return res.status(200).json(new ApiResponse(200,comment,"comment is successfully added"))

})

const updateComment = asynchandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}=req.params;
    const {content}=req.body;
    if(!commentId || !content){
        throw new APIError(400,"commentId and conetnet are required in params/body")
    }
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(403,"user is not authenticated")
    }
    const comment=await Comment.findById(commentId);
    if(!comment){
        throw new APIError(404,"comment which is to be updated do not exists")
    }
    if(comment.owner.toString()!==userId.toString()){
        throw new APIError(403,"the user is not authenticated to upadte the comment")
    }
    comment.content=content;
    await comment.save();
    const upadatedComment=await Comment.findById(commentId).populate("owner","username avatar")
    return res.status(200).json(new ApiResponse(200,upadatedComment,"the comment has been successfully updated"))
})

const deleteComment = asynchandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params;
    if(!commentId ){
        throw new APIError(400,"commentId are required in params")
    }
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(403,"user is not authenticated")
    }
    const comment=await Comment.findById(commentId);
    if(!comment){
        throw new APIError(404,"comment which is to be updated do not exists")
    }
    if(comment.owner.toString()!==userId.toString()){
        throw new APIError(403,"the user is not authenticated to upadte the comment")
    }
    await Comment.findByIdAndDelete(commentId);
    return res.status(200).json(new ApiResponse(200,{},"the comment is successfully deleted"))
})

const getVideoComments = asynchandler(async (req, res) => {
    // TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 3, sortBy = 'createdAt', sortType = 'desc' } = req.query;

    // Validate videoId
    if (!videoId) {
        throw new APIError(400, "videoId is needed here");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIError(404, "Video with the given videoId not found");
    }

    // Convert page and limit to numbers and validate
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    if (isNaN(pageNumber) || pageNumber <= 0) {
        throw new APIError(400, "Invalid page number");
    }
    if (isNaN(limitNumber) || limitNumber <= 0) {
        throw new APIError(400, "Invalid limit number");
    }

    // Validate sortBy and sortType
    const validSortFields = ['createdAt', 'updatedAt', 'content'];
    if (!validSortFields.includes(sortBy)) {
        throw new APIError(400, "Invalid sortBy field");
    }
    if (sortType !== 'asc' && sortType !== 'desc') {
        throw new APIError(400, "Invalid sortType value, should be 'asc' or 'desc'");
    }

    // Set sorting order
    const sort = {};
    sort[sortBy] = sortType === 'asc' ? 1 : -1;

    // Fetch comments from the database
    const comments = await Comment.find({ video: videoId })
        .populate("owner", "username avatar")
        .sort(sort)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

    // Check if comments exist
    if (comments.length === 0) {
        return res.status(404).json(new ApiResponse(404, [], "No comments found for the given video"));
    }

    // Fetch total number of comments for the video
    const totalComments = await Comment.countDocuments({ video: videoId });

    return res.status(200).json(new ApiResponse(200, {
        page: pageNumber,
        limit: limitNumber,
        totalComments,
        comments
    }, "All comments of the video fetched successfully"));
});

export {addComment,updateComment,deleteComment,getVideoComments}