class ApiResponse{
    constructor(statusCode,data,message="success"){
        this.data=data
        this.statusCode=statusCode
        this.message=message
        this.success=statusCode<400
    }
}