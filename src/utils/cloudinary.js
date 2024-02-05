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

const deleteFromCloudinary = async (deletedUrl) => {
  try {
    if (!deletedUrl) return null;
    console.log("old         ",deletedUrl);
    const public_id = deletedUrl.split('/')[7].split('.')[0];

    console.log("old         ",public_id);
    const response = await cloudinary.uploader.destroy(public_id);
    console.log(response);
    
    if (response.result === 'ok') {
      console.log('Image deleted successfully');
      return response;
    } else {
      console.error('Error deleting image from Cloudinary:', response);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export { uploadOnCloudinary,
  deleteFromCloudinary }