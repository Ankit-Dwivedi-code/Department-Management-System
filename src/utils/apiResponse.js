class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode  //The HTTP status code of the response.
        this.data = data  //The data to be included in the response.
        this.message = message  //A message describing the response (default is "Success" if not provided).
        this.success = statusCode < 400 // Initializes the success property based on the statusCode. This property is a boolean indicating whether the response indicates a successful request. By convention, HTTP status codes below 400 represent success, so statusCode < 400 will be true for successful responses and false for error responses.
    }
}

export { ApiResponse }

