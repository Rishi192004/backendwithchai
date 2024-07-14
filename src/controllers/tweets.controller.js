import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { APIError } from "../utils/APIError.js";
import { Tweet } from "../models/tweets.model.js";
import { User } from "../models/user.model.js";

const createTweet = asynchandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body;
    if(!content){
        throw new APIError(400,"content body is empty")
    }
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(403,"USER IS NOT AUTHENTICATED")
    }
    const tweet=await Tweet.create({
        content,
        owner:userId
    });
    if(!tweet){
        throw new APIError(500,"SOMETHING WENT WRONG WHILE CREATING TWEET")
    }
     return res.status(200).json(new ApiResponse(200,tweet,"tweet is successfully created"))
})


export{createTweet}