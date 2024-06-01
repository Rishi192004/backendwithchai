import mongoose,{Schema, Types} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videosSchema=new Schema({
    videoFile:{
        type:String,     //cloudenary url
        required:true
    },
    thumbNail:{
        type:String,     //cloudenary url
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    views:{
        type:Number,
        default: 0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
     

},{
    timestamps:true
})

videosSchema.plugin(mongooseAggregatePaginate);
export const Video=mongoose.model("Video",videosSchema)