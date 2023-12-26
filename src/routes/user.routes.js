import { Router } from "express";
import { refreshAccessToken, loginUser, logout, registerUser } from "../controllers/user.controller.js";
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
router.route("./refres-token").post(refreshAccessToken);

export default router