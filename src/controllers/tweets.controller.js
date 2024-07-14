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

const getUserTweets = asynchandler(async (req, res) => {
    // TODO: get user tweets
    const {userId}=req.params;
    if(!userId){
        throw new APIError(400,"userId in req.params should be there")
    }
    //find that user exists with this userd or not
    const user=await User.findById(userId)
    if(!user){
        throw new APIError(400,"no such user with give userId is found")
    }
    const tweets=await Tweet.find({owner:userId}).populate("owner","username avatar");
     
    if(tweets.length===0 || !tweets){
        throw new APIError(400,"there is no tweet by the user")
    }
    return res.status(200).json(new ApiResponse(200,tweets,"all tweets by the user is sent"))
})

const updateTweet = asynchandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params;
    const {content}=req.body;
    if(!tweetId || !content){
        throw new APIError(400,"tweetId is required in params and content in body")
    }
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(403,"user is not authenticated")
    }
    const tweet=await Tweet.findById(tweetId);
    if(!tweet){
        throw new APIError(404,"no such tweet with given tweeId found")
    }
    //isse koi bhi aadi tweet update nhi kr skta,only tweet ka owner hi kr payega
    if(tweet.owner.toString()!==userId.toString()){
        throw new APIError(403,"User is not authorized to update this tweet")
    }
    tweet.content=content;
    await tweet.save();
    const updatedTweet=await Tweet.findById(tweetId).populate("owner","username avatar");
    if(!updatedTweet){
        throw new APIError(500,"Failed to fetch the updated tweet")
    }
    return res.status(200).json(new ApiResponse(200,updatedTweet,"your tweet has been updated"))
})
//i will return {} after deleting,but if i am making instagram feed then(reel page) then i have to return whole list of feed afr deleting a single feed
const deleteTweet = asynchandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params;
    if(!tweetId){
        throw new APIError(400,"tweetId is required in params")
    }
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(403,"user is not authenticated")
    }
    const tweet=await Tweet.findById(tweetId);
    if(!tweet){
        throw new APIError(404,"no such tweet with given tweetId found")
    }
    if(tweet.owner.toString()!==userId.toString()){
        throw new APIError(403,"User is not authorized to delete this tweet")
    }
    await Tweet.findByIdAndDelete(tweetId)
    return res.status(200).json(new ApiResponse(200,{},"successfully deleted the tweet"))

})

export{createTweet,getUserTweets,updateTweet,deleteTweet}