import {v2 as cloudinary} from "cloudinary";
import fs from "fs"
cloudinary.config({ 
    cloud_name: process.env.CLOUDENARY_CLOUD_NAME, 
    api_key: process.env.CLOUDENARY_API_KEY, 
    api_secret: process.env.CLOUDENARY_API_SECRET,  
});

const uploadOnCloudenary= async (localFilePath) =>{
 try {
    if(!localFilePath){
        console.log("null")
        return null
    }
    console.log("file is being uploaded")
    const response=await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
    })
     fs.unlinkSync(localFilePath)
    return response;
 } catch (error) {
    //if error then from unlink the file url from locall server also
    //sync because i want that after unlinking only i move further
    console.log("bhai cloudenary setup mai dekho")
   fs.unlinkSync(localFilePath)
    return null;
 }
 }

const extractPublicId=async function extractPublicId(url) {
    const parts = url.split('/');
    const publicIdWithExtension = parts[parts.length - 1]; // Get the last part with the extension
    const publicId = publicIdWithExtension.split('.')[0]; // Remove the extension to get the public ID
    return publicId;
}

const deleteFromCloudinary=async function deleteFromCloudinary(publicId) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
}

 export { uploadOnCloudenary , extractPublicId , deleteFromCloudinary };