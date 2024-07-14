import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { APIError } from "../utils/APIError.js";
import { playList } from "../models/playList.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asynchandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new APIError(401, "User is not authenticated");
    }

    const { name, description } = req.body;
    
    if (!name || !description) {
        throw new APIError(400, "Name and description are both required");
    }
     
    const playlist = await playList.create({
        name,
        description,
        owner: userId
    });

    if (!playlist) {
        throw new APIError(500, "Internal server error");
    }

    res.status(201).json(new ApiResponse(201, playlist, "Playlist created"));
});

const addVideoToPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId){
        throw new APIError(400,"playlistId or videoId is missing")
    }
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(400,"user not authenticated")
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new APIError(400,"no video found from videId")
    }
    const playlist=await playList.findByIdAndUpdate(playlistId,
        {
            $addToSet:{videos:videoId}
        },
        {new:true}
    ) .populate({
        path: 'videos',  // Path to populate
        select: 'thumbNail owner videoFile title views',  // Fields to include from the Video model
        populate: {  // Populate the owner field with username from the User model
            path: 'owner',
            select: 'username'
        }
    })
    .populate({
        path: 'owner',  // Populate the owner field of the Playlist
        select: 'username'
    });

     
    if(!playlist){
        throw new APIError(400,"no playlist with playListId found")
    }
     return res.status(200).json(new ApiResponse(200,playlist,"added video to playList"))
})
//koi bhi aadmi kisi ka bhi playList dekh skta hai,SECURITY AND TOGGLE FEATURE WILL BE ADDED AFTER SOMETIMES
const getUserPlaylists = asynchandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!userId) {
        throw new APIError(401, "userId not there");
    }
    const playlist=await playList.find({owner:userId})
    .populate({
        path:'videos',
        select:'thumbNail owner videoFile title views',
        populate:{
            path:'owner',
            select:'username'
        }
    })
    .populate({
        path: 'owner', 
        select: 'username'
    })

    if (!playlist || playlist.length === 0) {
        throw new APIError(404, "No playlists found for the user");
    }
    return res.status(200).json(new ApiResponse(200,playlist,"playlist of user is sent"));
})

const getPlaylistById = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new APIError(401,"playList id is important to enter")
    }
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(401,"user not authenticated")
    }
    const playlist=await playList.findById(playlistId)
    .populate({
        path:'videos',
        select:'thumbNail owner videoFile title views',
        populate:{
            path:'owner',
            select:'username'
        }
    })
    .populate({
        path:'owner',
        select:'username'
    });
    if(!playlist){
        throw new APIError(400,"no such playlist exists")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"playlist by give playlistId is sent successfully"))
})

const deletePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
     if(!playlistId){
        throw new APIError(400,"playListId is required here")
     }
     const userId=req.user?._id;
     if(!userId){
        throw new APIError(401,"user is not authenticated")
     }
     const playlist=await playList.findById(playlistId);
     if(!playlist){
        throw new APIError(404,"no such playList with given Id is present")
     }
     if(playlist.owner.toString()!==userId.toString()){
        throw new APIError(402,"the user is not authenticated to delete this playlist")
     }
     await playList.findByIdAndDelete(playlistId);
     return res.status(200).json(200,{},"this playList is successfully deleted")
     
})

const updatePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!playlistId || !name || !description){
        throw new APIError(400,"playlistId or name or description is missing")
    }
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(400,"user is not authenticated")
    }
    const playlist=await playList.findById(playlistId);
    if(!playlist){
        throw new APIError(400,"playlist not found");
    }
    if(playlist.owner.toString()!==userId.toString()){
        throw new APIError(402,"this playlist can't be updated by this user, he's not authenticated")
    }
    playlist.name=name;
    playlist.description=description;
    await playlist.save();
    return res.status(200).json(200,playlist,"playlist has been updated")
})

const removeVideoFromPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId || !videoId){
        throw new APIError(400,"either playlistId or videoId is not there in params")
    }
    const playlist=await playList.findById(playlistId);
    if(!playlist){
        throw new APIError(404,"the playlit with given playlistId do not exists")
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new APIError(404,"no such video with given videoId found")
    }
    const userId=req.user?._id;
    //check that is owner of playlist the user_id wala user only!!!
    //user can add any video in playlist
    if(playlist.owner.toString()!==userId.toString()){
        throw new APIError(403,"the authenticated user is not the owner of playlist")
    }
    const videoIndex = playlist.videos.indexOf(videoId);
    if (videoIndex === -1) {
        throw new APIError(404, "Video not found in the playlist");
    }

    playlist.videos.splice(videoIndex, 1);
    await playlist.save();
    const newPlaylist=await playList.findById(playlistId);
    return res.status(200).json(new ApiResponse(200,newPlaylist,"given video is succesfully deleted from the playList"))

})
export{createPlaylist,addVideoToPlaylist,getUserPlaylists,getPlaylistById,deletePlaylist,updatePlaylist,removeVideoFromPlaylist}