const asynchandler=(fn)=> async(err,req,res,next)=>{
    try {
        await fn(err,req,res,next);
    } catch (err) {
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
}
//abhi tk iska kaam smjh nhi aya,mtlb yeh to pta hai ki ye function krta kya hai but kyu use kiya hai
export {asynchandler}