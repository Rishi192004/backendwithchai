import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js"; 
import { uploadOnCloudenary , extractPublicId , deleteFromCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"; 
import { subscription } from "../models/subscription.model.js";


const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const refreshToken=user.generateRefreshToken()
        const accessToken=user.generateAccessToken()

        console.log("Generated Access Token:", accessToken); 
        console.log("Generated Refresh Token:", refreshToken);  

        user.refreshToken=refreshToken
        await user.save({ validateBeforeSave: false})
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
    "-password -refreshToken"
   )
   //console.log(dbConnect)
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
     if(!user){
        throw new APIError(404,"user does not exist123")
    }
    //console.log(user);

   const isPasswordValid=await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new APIError(404,"user does not exist")
    }

 
   const {accessToken, refreshToken}=await generateAccessAndRefreshToken(user._id);
    
  
   const logedInUser=await User.findById(user._id).select("-password")
 
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
        secure:true
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
        console.log("this is decoded token:",decodedToken);
       const user=await User.findById(decodedToken._id)
       if(!user){
        throw new APIError(401,"invalid refresh token")
       }
       if(incomingRefreshToken!==user?.refreshToken){
        throw new APIError(401,"refresh token not matched so its expired or used")
       }
       const option={
        httpOnly:true,
        //secure:true
       }
       const {accessToken,RefreshToken}=await generateAccessAndRefreshToken(user._id)
       return res
       .status(200)
       .cookie("accessToken",accessToken,option)
       .cookie("refreshToken",RefreshToken,option)
       .json(
        new ApiResponse(200,{accessToken,RefreshToken},"refreshToken generated successfully")
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
    return res
    .status(200)
    .json(200,req.user,"current user fetched")
})

const updateAccountDetails=asynchandler(async(req,res)=>{
    const {fullname,email}=req.body
    //here i dont want the user to be able to change his/her username
    //here we should not give option for files change as it can lead to difficulties so for file update keep a diff route
    if(!fullname || !email){
        throw APIError(400,"both field required for updation")
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
    if (!user) {
        throw new APIError(404, "User not found");
    }

    const oldAvatarPublicId = user.avatar ? extractPublicId(user.avatar) : null;

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

    return res
    .status(200)
    .json(new ApiResponse(200,subscribersCount,subscribedToCount,isSubscribed,username,user.fullname,user.avatar,user,coverImage),
"user channel profile sent")
})



export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getUser,updateAccountDetails,
    updateAvatar,updateCoverImage,getUserChannelProfile
}