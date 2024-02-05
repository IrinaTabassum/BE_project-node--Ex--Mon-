import { User } from "../models/user.model.js"
import { Subscription } from "../models/subsciption.model.js"
import { ApiErrors } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {

    try {

        const { channelId } = req.params;

        const userId = req.user.id;

        const channel = await User.findById(channelId);
        if (!channel) {
            throw new ApiErrors(404, "Channel not found")
        }

        const subscription = await Subscription.findOne({ subscriber: userId, channel: channelId });

        if (subscription) {
            await subscription.remove();
            return res.status(200).json(
                new ApiResponse(200, {}, "Unsubscribed successfully")
            );
        }
        else {
            await Subscription.create({
                subscriber: userId,
                channel: channelId,
            });

            return res.status(201).json(
                new ApiResponse(200, {}, "Subscribed successfully")
            );
        }
    }
    catch (error) {
        console.error("Error toggling subscription:", error);
        return res.status(500).json(
            new ApiErrors(500, "Internal Server Error")
        );
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    try {
        const { channelId } = req.params;
        const subscribers = await Subscription.find({ channel: channelId })
            .populate('subscriber', 'username');

        res.status(200).json(
            new ApiResponse(200, "Subscribers retrieved:", subscribers)
        );

    } catch (error) {
        console.error("Error retrieving subscirbers:", error);
        res.status(500).json(
            new ApiErrors(500, "Internal Server Error")
        );
    }
})

const getSubscribedChannels = asyncHandler(async (req, res) => {

    try {
        const { subscriberId } = req.params

        const subscriptions = await Subscription.find({ subscriber: subscriberId })
            .populate('channel', 'username');

        res.status(200).json(
            new ApiResponse(200, "Subscribed channels retrieved:", subscriptions)
        );

    } catch (error) {
        console.error("Error retrieving subscribed channels:", error);
        res.status(500).json(
            new ApiErrors(500, "Internal Server Error")
        );
    }

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}