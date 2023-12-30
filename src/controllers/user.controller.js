import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiErrors } from "../utils/apiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { now } from "mongoose";

const options={
    httpOnly: true,
    secure: true
}

const generateAccesstokenAndRefereshToken = async(userId)=>{
    try{
        const user = await User.findById(userId)
        
        const accessToken =  user.generateAccessToken()

        const refreshToken =  user.generateRefreToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    }catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }

}

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
    
    if(!avatar){
        throw new ApiErrors(400, "Avatar file is required")
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

const loginUser = asyncHandler(async(req, res)=>{

    const {username, email, password} = req.body;

    if(!(username || email)){
        throw new ApiErrors( 400, "email or username is required");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiErrors(400, "user is not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    
    if(!isPasswordValid){
        
        throw new ApiErrors(400, "Invatide user crenditals");
    }

    const {accessToken, refreshToken} = await generateAccesstokenAndRefereshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "user loged in successfull"
        )
    )

})
const logout = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            now:true
        }
    )

    const options={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshAccessToken = asyncHandler(async (req, res)=>{

    const getRefreshToken = req.cookie.refreshToken || req.body.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

    if(!getRefreshToken){
        throw new ApiErrors(400, "Unauthorize request");
    }

    const decodedToken = jwt.verify(getRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log(decodedToken);

    const user = await User.findById(decodedToken?._id);
    if(!user){
        throw new ApiErrors(400, "Invalide refresh token");
    }
    if(getRefreshToken !== user?.refreshToken){
        throw new ApiErrors(401, "Refresh token is expired or alrady used");
    }

    const {accessToken, newrefreshToken} = await generateAccesstokenAndRefereshToken(user._id);

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                accessToken,
                newrefreshToken
            },
            "assess token refreshed"
        )
    )
})

const changePassword = asyncHandler(async(req, res)=>{
    const {currentPasswort, newPassword} = req.body;
    console.log(req.body);

    if(!(currentPasswort || newPassword)){
        throw new ApiErrors(400, "new password and old password both are required");
    }

    const user = await User.findById(req.user?._id);
    if(!user){
        throw new ApiErrors(400, "user is unauthorize");
    }

    const varifiedPassword= await user.isPasswordCorrect(currentPasswort)

    if(!varifiedPassword){
        throw new ApiErrors(400, "Current password is not mathch")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return res.status(200)
    .json(new ApiResponse(200, {}, "Passwod changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res)=>{
    return res.status(200)
    .json(new ApiResponse(200, req.user, "current user get successfull"))
})

const updateUserDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {now:true}
    ).select("-password -refreshToken");
    
    if(!user){
        throw new ApiErrors(400, "user can't updste")
    }
    return res.status(200)
    .json(new ApiResponse(200,user, "user updated successfully"))
}) 

const updateProfileImage = asyncHandler(async(req, res)=>{
    
    const avaterLocalPath = req.file?.path;
    if(!avaterLocalPath){
        throw new ApiErrors(400, "cant find local path")
    }
    const avatar = await uploadOnCloudinary(avaterLocalPath)
    if(!avatar.url){
        throw new ApiErrors (400,"avatar is required")
    }
    const userold = await User.findById(req.user?._id)
    await deleteFromCloudinary(userold.avatar)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        { new:true}
    ).select("-password -refreshToken");
    
    if(!user){
        throw new ApiErrors(400, "user can't updste")
    }
    return res.status(200)
    .json(new ApiResponse(200,user, "user updated successfully"))
    

})

const updateCoverImage = asyncHandler(async(req, res)=>{
    
    const coverLocalPath = req.file?.path;
    if(!coverLocalPath){
        throw new ApiErrors(400, "cant find local path")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath);
    if(!coverImage.url){
        throw new ApiErrors (400,"cover image is required")
    }
    const userOld = await User.findById(req.user?._id)
    
    if(userOld.coverImage){
        await deleteFromCloudinary(userOld.coverImage)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage?.url||""
            }
        },
        {now:true}
    ).select("-password -refreshToken");
    
    if(!user){
        throw new ApiErrors(400, "user can't updste")
    }
    return res.status(200)
    .json(new ApiResponse(200,user, "user updated successfully"))
    

})


export {
    registerUser, 
    loginUser, 
    logout, 
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateUserDetails,
    updateProfileImage,
    updateCoverImage
}