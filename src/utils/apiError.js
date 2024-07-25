class ApiError extends Error{
    constructor (
        statusCode,  
        message = "Something went wrong",
        errors = [],  
        stack = "" 
    ){
        // Call the parent constructor to set the message property
        super(message);
        
        // Set custom properties specific to ApiError
        this.statusCode = statusCode; // HTTP status code // Initialize the statusCode property
        this.data = null; // Placeholder for additional data if needed // Initialize the data property
        this.message = message; // Error message // The message property, already set by super(message)
        this.success = false; // Indicates the success status (always false for errors)
        this.errors = errors; // Array of additional error details

        // Handle the stack trace
        if (stack) {
            this.stack = stack; // Use the provided stack trace if available
        } else {
            Error.captureStackTrace(this, this.constructor); // Capture the stack trace
        }
    }
}

export {ApiError}