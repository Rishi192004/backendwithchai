import mongoose from "mongoose";
import { playList } from "../models/playList.model.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { APIError } from "../utils/APIError.js";
 

const createPlaylist = asynchandler(async (req, res) => {
    const {name, description} = req.body
    if(!name || !description){
        throw new APIError(401,"name or description both are required")
    }
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(400,"user is not authenticated")
    }
    const playList=await playList.create({
        name,
        description,
        owner:userId
    });

    if(!playList){
        throw new APIError(500,"iternal server error")
    }
    res.status(200).json(new ApiResponse(200,playList,"playList created"))
})
export {createPlaylist}