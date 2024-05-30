import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";
const connectDB=async()=>{
    try {
        const DBresponse=await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`mongoDB connected:${DBresponse.connection.host}`)
    } catch (error) {
        console.log("ERRORs",error);
        process.exit(1)
    }
}
export default connectDB;