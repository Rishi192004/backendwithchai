import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";
import { upload } from "../middleware/multer.middleware.js";
import { uploadOnCloudenary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findOne(userId)
        const refreshToken=user.generateRefreshToken()
        const accessToken=user.generateAccessToken()

        user.refreshToken=refreshToken
        //validateBeforeSave is because when we save in database then it also requires all required fields to be passed but its not in login
        await user.save({validateBeforeSave: false})
        return {accessToken,refreshToken}
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
    console.log(avatarLocalPath)
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
    //req.body->data
    //check username or email excists or not
    //find user
    //if its there then is password correct
    //now generate access token and refresh token for autolog in
    //send cookie

    const {email,username,password}=req.body

    if(!username && !email){
        throw new APIError(400,"username or email is required")
    }

    const user= await User.findOne({
        $or:[{username} , {email}]
    })
    //HERE User IS NOT USED INSTEAD user IS USED BECAUSE ISPASSWORD CORRECT IS DEFINED BY ME SO IT WILL BE APPLIED TO THE RESPONSE WHICH DB HAS SENT TO ME AND I AM STORING IT IN user
    if(!user){
        throw new APIError(404,"user does not exist")
    }

     const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new APIError(404,"user does not exist")
    }

    //Now generate access and refresh token, and it is very common to generate both so making a function for this purpose

   const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
   // here the problem is that the user property does not have refreshtoken value because token value is called latter
   //now sending in cookies

   const logedInUser=await User.findById(user._id).select("-password -refreshToken");
//these option are sent with cookies
   const option={
    httpOnly:true,
    secure:true
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,option)
   .cookie("refreshToken",refreshToken,option)
   .json(
    new ApiResponse(200,
        {
            user:accessToken,refreshToken,logedInUser
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
            $set:{
                refreshToken:undefined
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

export {registerUser,loginUser,logoutUser}