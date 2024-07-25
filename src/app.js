import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({                                 //uses of cors
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "16kb"}))  //To get the json data and setted the limit of it
app.use(express.urlencoded({extended : true, limit : "16kb"})) // for url encoded just like ?=ankit+dwivedi
app.use(express.static("public")) //to serve the files to all just like favicon

app.use(cookieParser())  


//Routes Import
import studentRouter from './routes/student.route.js'
import adminRouter from './routes/admin.route.js'



//Routes Declaration

app.use("/api/v1/students", studentRouter)
app.use("/api/v1/admin", adminRouter)








export { app }