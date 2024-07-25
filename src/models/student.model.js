import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const StudentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    roll : {
        type : String,
        required : true
    },
    uniqueCode:{
        type: String,
        required : true
    },
    role: {
        type: String,
        default: 'student',
        enum: ['student']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    address: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },
    phone: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true,
        enum: ['1st Year', '2nd Year', '3rd Year']
    },
    fee: {
        type: Number,
        required: true
    },
    highestQualification: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    guardianDetails: {
        guardianName: {
            type: String,
            required: true
        },
        guardianPhone: {
            type: String,
            required: true
        },
        guardianEmail: {
            type: String,
            required: true
        },
        relationship: {
            type: String,
            required: true
        }
    },
    admissionDate: {
        type: Date,
        default: Date.now
    },
    refreshToken: {
        type : String
    },
    avatar : {
        type: String,  //cloudinary url
        required : true,
    },
}, {timestamps:true});

StudentSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

StudentSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
 }

 StudentSchema.methods.generateAccessToken = async function () {
    return jwt.sign(
     {
         _id : this._id,
         email : this.email,
         username : this.username    
     },
     process.env.ACCESS_TOKEN_SECRET,
     {
         expiresIn : process.env.ACCESS_TOKEN_EXPIRY
     }
    )
 }

 StudentSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
       )
}

export const Student = mongoose.model('Student', StudentSchema);