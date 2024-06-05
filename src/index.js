import dotenv from "dotenv";
 // require('dotenv').config({path: './env'})
//as above way looks UGLY HENCE WE USE AnOTHER WAY(which i dont like)--->yeh nhi CHAL RAHA BECAUSE ITS COMMON JS TYPE
import {app} from './app.js';
import connectDB from "./db/indexDB.js";
dotenv.config({
    path:'.env'
})
connectDB()
.then(()=>{
    
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is listening at ${process.env.PORT}`)
    });
})
.catch((err)=>{
    console.log("ERROR!!!!!!",err)
})







// import express from "express";
// const app=express();
// //to connect database we wrote below code(WRITTEN IN IIFE FUCTION TYPE APNI MARZI HAI BHIA JISME LIKH LO)
// ;( async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//         app.on("error",(error)=>{
//             console.log("error",error)
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`server is running on ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.error("ERROR",error);
//         throw error;
//     }
// })()