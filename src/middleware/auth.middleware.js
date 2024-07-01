import { APIError } from "../utils/APIError.js";
import { asynchandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


export const verifyJWT=asynchandler(async(req, _,next)=>{
    try {
        console.log(req.cookies)
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","").trim()
        console.log("Extracted token:", token); 
        
        if(!token){

            throw new APIError(401,"unauthorized request")

        }
 
 
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

 
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");

        if(!user){
            throw new APIError(401,"Invalid AccessToken")
            //so here i have to send end point for generating access token
        }

 
        req.user=user;

        next()
    
    } catch (error) {
        console.log("here is the error",error)
        throw new APIError(401, "invalid user credential")
    }
})