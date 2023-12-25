import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiErrors } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";


const registerUser = asyncHandler( async (req, res)=>{

    const {fullName, email, username, password} = req.body;

    if([fullName, email, username, password].some((find) => find?.trim() ==="")){
        throw new ApiErrors(400, "All fields are required")
    }

    const isemailexist = await User.findOne({email});

    if(isemailexist){
        throw new ApiErrors(400,"User with this email already exists")
    }
    const isusernameexist = await User.findOne({username});

    if(isusernameexist){
        throw new ApiErrors(400,"User with this username already exists")
    }

    const avaterLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
   
    if(!avaterLocalPath){
        throw new ApiErrors(400, "Avatar file is required")
    }
    
    const avatar = await uploadOnCloudinary(avaterLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log(avatar);
    if(!avatar){
        throw new ApiErrors(400, "Avatar jkkk file is required")
    }

    const user = await User.create(
        {
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email, 
            password,
            username: username.toLowerCase()
        }
    )
   const createUser = await User.findById(user._id).select(
    "-password -refreshToken"
   ) 
   if(!createUser){
        throw new ApiError(500, "Something went wrong while registering the user")
   }

    return res.status(200).json(
        new ApiResponse(200, createUser, "User registered Successfully")
    )

})


export {registerUser}