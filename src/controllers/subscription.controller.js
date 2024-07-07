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

const getUserChannelSubscribers=asynchandler(async(req,res)=>{
    const userId=req.user?._id;
    if(!userId){
        throw new APIError(400,"user channel not authenticated");
    }
    const user=await User.findById(userId);
    if(!user){
        throw new APIError(400,"user not found");
    }
    const channelsSubscriber=await subscription.find({channel:userId}).populate('subscriber','username fullname avatar').exec()

    if(channelsSubscriber.length===0){
        return res.status(200).json(new ApiResponse(200,{},"channel has no subscriber"));
    }
    return res
    .status(200)
    .json(new ApiResponse(200,channelsSubscriber,"channel subscriber details sent"));
})

const toggleSubscription=asynchandler(async(req,res)=>{
    //frontend dev will send these three things when the user hits the subscribe button
    const {channelId,subscriberId,subStatus}=req.body;
    if(!channelId || !subscriberId ){
        throw new APIError(400,"Missing channelId or subscriberId")
    }
    const userId=req.user?._id;

    if(!userId){
        throw new APIError(400,"User is not authenticated");
    }

    if(subscriberId !== userId.toString()) {
        throw new APIError(400, "Subscriber ID does not match the authenticated user");
    }

    if(subStatus){
        const alreadySubscribed=await subscription.findOne({subscriberId,channelId});
        if(alreadySubscribed){
            throw new APIError(400,"user is already subscribed to channel")
        }
        const creationInSubModel=await subscription.create({
            subscriberId,
            channelId,
        })
        return res.status(200).json(new ApiResponse(200,creationInSubModel,"successfully subscribed"));
    }else{
        const alreadySubscribed=await subscription.findOne({subscriberId,channelId});
        if(!alreadySubscribed){
            throw new APIError(400,"user is already subscribed to channel")
        }
        //unsubscribed
       await subscription.deleteOne({subscriberId,channelId});
       //gpt is saying to convert this {} to null
       return res.status(200).json(new ApiResponse(200,{},"Successfully unsubscribed"))
    }
})



 export{ getSubscribedChannels, getUserChannelSubscribers, toggleSubscription }