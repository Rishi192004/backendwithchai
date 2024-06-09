import { APIError } from "../utils/APIError.js";
import { asynchandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


export const verifyJWT=asynchandler(async(req,res,next)=>{
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")
        if(!token){
            throw new APIError(401,"unauthorized request")
        }
        //verify that is accesstoken sae as of user
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
        if(!user){
            throw new APIError(401,"Invalid AccessToken")
            //so here i have to send end point for generating access token
        }
        req.user=user;
        next()
    
    } catch (error) {
        throw new APIError(401,error?.message || "invalid user credential")
    }
})