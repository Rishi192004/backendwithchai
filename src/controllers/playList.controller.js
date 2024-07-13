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
export {createPlaylist,addVideoToPlaylist}