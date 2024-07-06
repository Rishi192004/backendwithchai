import { User } from "../models/user.model.js";
import { subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { APIError } from "../utils/APIError.js";
import { asynchandler } from "../utils/asynchandler.js";

 const getSubscribedChannels=asynchandler(async(req,res)=>{
    //console.log("hi hi hi hi hi")
    const userId=req.user?._id;
    if (!userId) {
        throw new APIError(400, "User not authenticated");
    }
    const user=await User.findById(userId)
    if(!user){
        throw new APIError(400,"user do not excists")
    }
    //jaha subscriber pe meri id hogi mai un sare channel ka ek list bna raha hun
   const subscibedChannel=await subscription.find({subscriber:userId}).populate('channel','username fullname avatar')
   console.log(subscibedChannel)
   if(subscibedChannel.length===0){
    return res.status(200).json(new ApiResponse(200,{},"you have not subscribed any channel yet"))
   }
   return res
   .status(200)
   .json(new ApiResponse(200,subscibedChannel,"list of subscribed channels sent"))
 })

 export{ getSubscribedChannels }