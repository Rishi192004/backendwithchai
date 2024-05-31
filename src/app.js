import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}
)) 
//this thing below is for taking data from json file
app.use(express.json({limit:"10kb"}))
//thing below is for taking data from url
app.use(express.urlencoded({limit:"10kb",extended:true}))
//thing below is for cookie parser
app.use(express.cookieParser())
//making configuration for storing file,folder in public if needed
app.use(express.static("public"))


export {app}
