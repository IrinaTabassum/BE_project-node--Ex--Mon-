import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";

          
cloudinary.config({ 
  cloud_name: 'dahcfgf2a', 
  api_key: '463765182452645', 
  api_secret: 'G8L4vu9Vz38X1dKlx6HUMDi_hLk' 
});

const uploadOnCloudinary = async (localFilePath) =>{
  try{
    if(!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath)
    // console.log("file uplode successfully", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch(error){
    fs.unlinkSync(localFilePath);
    return null;
  }

}

export { uploadOnCloudinary }