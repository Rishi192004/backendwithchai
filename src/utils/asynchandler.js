const asynchandler=(requestHandler)=> {
    return (req,res,next)=>{
     Promise.resolve(requestHandler(req,res,next)).catch(
        (err)=>next(err)
     )
     
    }
}
//abhi tk iska kaam smjh nhi aya,mtlb yeh to pta hai ki ye function krta kya hai but kyu use kiya hai
export {asynchandler}