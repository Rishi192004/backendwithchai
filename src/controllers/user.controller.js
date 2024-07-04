import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js"; 
import { uploadOnCloudenary , extractPublicId , deleteFromCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"; 
import { subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js"


const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId) 
         
        const refreshToken=await user.generateRefreshToken();
        const accessToken=await user.generateAccessToken(); 
        
        user.refreshToken= refreshToken;
         
        await user.save({ validateBeforeSave: false }).catch(error => {
         
        throw new APIError(500, "Failed to save user with refreshToken");
    });

        return { accessToken: await accessToken, refreshToken: await refreshToken };
    } catch (error) {
        throw new APIError(500,"something went wrong while generating tokens")
    }
}

const registerUser=asynchandler( async (req,res)=>{
    //get user details from frontend-->req field,destructuring
    const { username, email, fullname, password }=req.body;
     
    //validation that is anything empty or not?
    if([username, email, fullname, password].some((field)=>field?.trim()==="")){
        throw new APIError(400,"some filed is empty")
    }

    //checking if user already exsists or not
    const exsistUser= await User.findOne({
        $or:[{username},{email}]
    })
    if(exsistUser){
        throw new APIError(409,"user already exsists")
    }

    //check for images,avatar
     
    const avatarLocalPath=req.files?.avatar[0]?.path
    //console.log(req.files)
    //console.log(avatarLocalPath)
    //const coverImageLocalPath=req.files?.coverImage[0]?.path
let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path;
}

//check if avatar's local file path is recienved or not
    if(!avatarLocalPath){
        throw new APIError(400,"image not uploaded")
    }
    
    //upload on cloudenary
     
   const avatar=await uploadOnCloudenary(avatarLocalPath)
   //console.log(avatar)
   const coverImage=await uploadOnCloudenary(coverImageLocalPath)

   
   //again check whether avatar is uploaded or not on cloudenary
   if(!avatar){
    throw new APIError(400,"image not uploaded123")
   }
   //now creating entry for db,only user is talking to database so use it for it
   const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
   }) 
   //CHECKING WHETHER MY DB IS CONNECTED OR NOT, AND DISELECTING PASSWORD AND REFRESHTOKEN
   const dbConnect= await User.findById(user._id).select(
    "-password"
   )
    
   if(!dbConnect){
    throw new APIError(500,"something went wrong while registration")
   }

    return res.status(201).json(
       new ApiResponse(200,dbConnect,"user is registered")
    )
})

const loginUser=asynchandler(async (req,res)=>{
    const {email,username,password}=req.body
    if(!username && !email){
        throw new APIError(400,"username or email is required")
    }

    const user= await User.findOne({
        $or:[{username} , {email}]
    })
    //console.log("bhaya plz",user)
     if(!user){
        throw new APIError(404,"user does not exist123")
    }
     

   const isPasswordValid=await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new APIError(404,"user does not exist")
    }

 
   const {accessToken, refreshToken}=await generateAccessAndRefreshToken(user._id);
    
  
   const logedInUser=await User.findById(user._id).select(" -password -refreshToken")

   console.log("logged in user:",logedInUser)

 
   const option={
    httpOnly:true,
    secure:true
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,option)
   .cookie("refreshToken",refreshToken,option)
   .json(
    new ApiResponse(
        200,
        {
            logedInUser,accessToken,refreshToken
        },
        "user logged in succesfully"
    )
   )
})

const logoutUser=asynchandler(async (req,res)=>{
    //finding user is difficult because in logout i dont hand in a form so that req.body wull have this in work
    // here comes accesstoken
    //as for user to do any work accesstoken is always required hence fisrt confirming that is user there or not with access token
    //then if there then i can add a user in req and hence i can have access to user._id
    //injecting it with middleware
    
    
    //cookie is middleware and i can also access it ,in same way i will make a custom middleware through which i can access my id
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )
    const option={
        httpOnly:true,
        //secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken",option)
    .json(new ApiResponse(200,{},"user logged out successfully"))

})

const refreshAccessToken=asynchandler(async(req,res)=>{
    
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken 
    if(!incomingRefreshToken){
        throw new APIError(401,"unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
         
       const user=await User.findById(decodedToken._id)
        
        
       if(!user){
        throw new APIError(401,"invalid refresh token")
       }
        
       const dataBaseRefreshToken=await user?.refreshToken;
        
       if(incomingRefreshToken!== dataBaseRefreshToken){
        throw new APIError(401,"refresh token not matched so its expired or used")
       }
       const option={
        httpOnly:true,
        secure:true
       }
       const {accessToken,refreshToken: newRefreshToken }=await generateAccessAndRefreshToken(user._id)
       return res
       .status(200)
       .cookie("accessToken",accessToken,option)
       .cookie("refreshToken",newRefreshToken,option)
       .json(
        new ApiResponse(200,{accessToken,newRefreshToken},"refreshToken generated successfully")
       )
    
    } catch (error) {
        throw new APIError(400,error?.message ||"invalid refreshtoken")
    }
})

const changeCurrentPassword= asynchandler(async(req,res)=>{
    const {oldPassword , newPassword}=req.body
    //is oldPassword and password stored in db is same or not
    const user=await User.findById(req.user?._id)
    const isPasswordValid=await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new APIError(401,"password does not match")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
   

    return res 
    .status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))
})

const getUser=asynchandler(async(req,res)=>{
    console.log("check this:",req.user)
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched"))
})

const updateAccountDetails=asynchandler(async(req,res)=>{
    const {fullname,email}=req.body
    //here i dont want the user to be able to change his/her username
    //here we should not give option for files change as it can lead to difficulties so for file update keep a diff route
    if(!fullname || !email){
        throw new APIError(400,"both field required for updation")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"account details successfully updated"))
})

const updateAvatar=asynchandler(async(req,res)=>{
    const updatedAvatarPath=req.file?.path;
    if(!updatedAvatarPath){
        throw new APIError(400,"avatar file is missing")
    }

    const checkUser = await User.findById(req.user?._id);
    if (!checkUser) {
        throw new APIError(404, "User not found");
    }

    const oldAvatarPublicId = checkUser.avatar ? extractPublicId(checkUser.avatar) : null;

    const uploadedAvatarPath= await uploadOnCloudenary(updatedAvatarPath)
    if(!uploadedAvatarPath.path){
        throw new APIError(500,"avatar's URI not recieved after uploading")
    }

    if (oldAvatarPublicId) {
        await deleteFromCloudinary(oldAvatarPublicId);
    }

   const user=await User.findByIdAndUpdate(
    req.user._id,
    {
        $set:{
            avatar:uploadedAvatarPath.url
        }
    },
    {new:true}
).select("-password")
    
   return res
   .status(200)
   .json(new ApiResponse(200,user,"avatar updated successfully"))
   
})

const updateCoverImage=asynchandler(async(req,res)=>{
    const updatedCoverImagePath=req.file?.path;
    if(!updatedCoverImagePath){
        throw new APIError(400,"avatar file is missing")
    }
    const checkUser = await User.findById(req.user?._id);
    if (!user) {
        throw new APIError(404, "User not found");
    }

    const oldCoverImagePublicId = user.coverImage ? extractPublicId(user.coverImage) : null;

    const uploadedCoverImagePath= await uploadOnCloudenary(updatedCoverImagePath)
    if(!uploadedCoverImagePath.path){
        throw new APIError(500,"cover image URI not recieved after uploading")
    }

    if (oldCoverImagePublicId) {
        await deleteFromCloudinary(oldCoverImagePublicId);
    }
   const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            coverImage:uploadedCoverImagePath.url
        }
    },
    {new:true}
).select("-password")
    
   return res
   .status(200)
   .json(new ApiResponse(200,user,"avatar updated successfully"))
   
})

const getUserChannelProfile=asynchandler(async(req,res)=>{
     //i will have link for profile of channel
    const {username}=req.params
    if(!username?.trim()){
        throw new APIError(400,"Username not there")
    }
    const user=await User.findOne({username:username.toLowerCase()})
    if(!user){
        throw new APIError(400,"channel not found")
    }
    //user._id yash mittal ki id hai
    const subscribersCount=await subscription.countDocuments({channel: user._id})

    const subscribedToCount=await subscription.countDocuments({subscriber:user._id})

    const isSubscribed = await subscription.exists({
            //req.user because bhai yeh woh bnda hai jo mera app chala raha hoga
        subscriber: req.user?._id,
            //aur user mai maine uss channel ka profile nikal ke laya hun
        channel: user._id


        /*he exists method checks if there is a document in the subscriptions collection where:
    The subscriber field matches the _id of the currently authenticated user (req.user?._id).
    The channel field matches the _id of the channel owner (user._id).*/
    });
    const userId=await user._id;
    const videos=await Video.find({owner:userId}).populate("owner","username").exec();


    return res.status(200).json(new ApiResponse(
        200,
        {
            subscribersCount,
            subscribedToCount,
            isSubscribed,
            username: user.username,
            fullname: user.fullname,
            avatar: user.avatar,
            coverImage: user.coverImage,
            video:videos
        },
        "User channel profile fetched successfully"
    ));
})
const getWatchHistoryOfUser=asynchandler(async(req,res)=>{
    //verifyJWT
    const userId=req.user?._id
    if(!userId){
        throw new APIError(400,"user not authenticated")
    }
    const user=await User.findById(userId);
    if(!user){
        throw new APIError(400,"didnt recieved user from auth id")
    }
    //i got yash mittal here

    const videoId=await user.watchHistory
    //here i got all id's of videos which yash mittal has viewed
    if(videoId.length()==0){
        return res.status(200).json(new ApiResponse(200, [], "No videos in watch history"));
    }
    //if error occurs then segregate and write the video line(just below one)
    const video=await Video.find({_id:{$in:videoId}}).select("-description").populate("owner","username").exec()

    if (video.length === 0) {
        return res.status(404).json(new ApiResponse(404, [], "No videos found in the watch history 2nd"));
    }
    

    //now return response to frontend engineer
    return res
    .status(200)
    .json(new ApiResponse(200,video,"successfully fetched the videoHistory of the user"))
})

const videosCreatedByUser=asynchandler(async(req,res)=>{
    const userId=req.user?._id;
    const myUser=await User.findById(userId);
    if(!myUser){
        throw new APIError(400,"didn't got myUser")
    }
    const myVideo=await Video.find({owner:userId}).populate("owner","username").exec()
    if(myVideo.length===0){
        return new ApiResponse(200,{},"no videos created by you")
    }
    return res
    .status(200)
    .json(new  ApiResponse(200,myVideo,"Successfully fetched the videos created by the user"))
})




export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getUser,updateAccountDetails,
    updateAvatar,updateCoverImage,getUserChannelProfile,getWatchHistoryOfUser,videosCreatedByUser
}