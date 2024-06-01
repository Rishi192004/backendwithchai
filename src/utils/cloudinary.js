import {v2 as cloudinary} from "cloudinary"
import { response } from "express";
import fs from "fs"
cloudinary.config({ 
    cloud_name: "process.env.CLOUDENARY_CLOUD_NAME", 
    api_key: "process.env.CLOUDENARY_API_KEY", 
    api_secret: "process.env.CLOUDENARY_API_SECRET"  
});

const uploadOnCloudenary= async (localFilePath) =>{
 try {
    if(!localFilePath) return null;
    const response=await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
    })
    //here file is successfully uploaded now unlink the file
     console.log("file successfully uploaded",response.url)
     return response;
 } catch (error) {
    //if error then from unlink the file url from locall server also
    //sync because i want that after unlinking only i move further
    fs.unlinkSync(localFilePath)
    return null;
 }
 }

 export default uploadOnCloudenary;