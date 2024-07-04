import mongoose,{Schema} from "mongoose";
//by writing in above wa mongoose.schema will be runned when mongoose will be written
import jwt from"jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema=new Schema({
    username:{
        type:String,
        required: true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required: true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required: true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,//cloudinary url
        required:true
    },
    coverImage:{
        type:String,//cloudinary url
    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        required:true
    },
    refreshToken:{
        type:String 
    }

},{
    timestamps:true
})
userSchema.pre("save", async function (next) {
    //console.log("hi")
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
     //console.log("my entered password->",password,"database password->",this.password)
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken=async function(){
    //a signature is returned which is encrypted and has following data which is to be decoded when been used
    //.sign method returns a token consisting of payload header etc,which is to be decode when accessing payload
   return jwt.sign(
        {
            //payload
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
        
    )
};
userSchema.methods.generateRefreshToken=async function(){
    return jwt.sign(
        {
            //payload
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
        
    )
};

export const User=mongoose.model("User",userSchema)