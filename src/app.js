import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import bodyParser from 'body-parser';
const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,//* origin means to allow every request
    credentials:true
}
)) 
//this thing below is for taking data from json file
app.use(express.json({limit:"10kb"}))
app.use(bodyParser.json());
//thing below is for taking data from url
app.use(express.urlencoded({limit:"10kb",extended:true}))
//thing below is for cookie parser
app.use(cookieParser())
//making configuration for storing file,folder in public if needed
app.use(express.static("public"))

//routes import
import userRouter from './routes/user.router.js'
import subscriptionRouter from './routes/subscription.router.js'
import videoRouter from './routes/video.router.js'
import playListRouter from './routes/playList.router.js'
import tweetRouter from'./routes/tweets.router.js'
import likeRouter from './routes/likes.router.js'
import commentsRouter from './routes/comment.router.js'
import dashBoardRouter from './routes/dashboard.router.js'
//routes declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/playList",playListRouter)
app.use("/api/v1/Tweet",tweetRouter)
app.use("/api/v1/Likes",likeRouter)
app.use("/api/v1/Comments",commentsRouter)

app.use("/api/v1/dashboard",dashBoardRouter)

export {app}
