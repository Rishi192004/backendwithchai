import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { APIError } from "../utils/APIError.js";
import { playList } from "../models/playList.model.js";

const createPlaylist = asynchandler(async (req, res) => {
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(400,"user is not authenticated")
    }

    
    const { name , description } = req.body
    console.log(name);
    console.log(description)
    if(!name || !description){
        throw new APIError(401,"name or description both are required")
    }
     
    const PlayList=await playList.create({
        name,
        description,
        owner:userId
    });

    if(!playList){
        throw new APIError(500,"iternal server error")
    }
    res.status(200).json(new ApiResponse(200,PlayList,"playList created"))
})
export {createPlaylist}