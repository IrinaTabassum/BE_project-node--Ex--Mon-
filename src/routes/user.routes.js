import { Router } from "express";
import { refreshAccessToken, loginUser, logout, registerUser, changePassword, updateUserDetails, getCurrentUser, updateProfileImage, updateCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { varifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),

    registerUser
    );
router.route("/login").post(loginUser);  
//secure rote
router.route("/logout").post(varifyJWT,logout);  
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(varifyJWT,changePassword);
router.route("/get-login-user").get(varifyJWT,getCurrentUser);
router.route("/update").post(varifyJWT,updateUserDetails);
router.route("/update-profileimg").post(varifyJWT,upload.single("avatar"),updateProfileImage);
router.route("/update-coverimg").post(varifyJWT,upload.single("coverImage"),updateCoverImage);

export default router