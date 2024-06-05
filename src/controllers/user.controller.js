import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";
import { upload } from "../middleware/multer.middleware.js";
import { uploadOnCloudenary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
   if(!dbConnect){
    throw new APIError(500,"something went wrong while registration")
   }

    return res.status(201).json(
       new ApiResponse(200,dbConnect,"user is registered")
    )
   

})

export {registerUser}