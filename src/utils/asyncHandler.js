const asyncHandler = (requestHandler) =>{  //asyncHandler is defined as a higher-order function. It takes a single argument, 
    return (req, res, next) =>{  //Inside asyncHandler, it returns a new function that takes req, res, and next as parameters.
        Promise.resolve(requestHandler(req, res, next)) //Inside the returned function, it wraps the requestHandler call in Promise.resolve(). This ensures that even if requestHandler is not already returning a promise, it will be converted into a promise.
        .catch((err)=> next(err))  //If the promise is rejected (i.e., an error occurs), the .catch method catches the error and passes it to next(err). This allows Express to handle the error using its error-handling middleware.
    }
}

export {asyncHandler}