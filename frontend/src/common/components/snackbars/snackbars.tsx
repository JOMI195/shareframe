import AuthenticationAlertSnackbar from "../snackbars/alertSnackbar";
import AuthenticationLoadingSnackbar from "../snackbars/loadingSnackbar";
import ContactAlertSnackbar from "../snackbars/alertSnackbar";
import ContactLoadingSnackbar from "../snackbars/loadingSnackbar";
import FriendshipsAlertSnackbar from "../snackbars/alertSnackbar";
import FriendshipsLoadingSnackbar from "../snackbars/loadingSnackbar";
import FramesAlertSnackbar from "../snackbars/alertSnackbar";
import FramesLoadingSnackbar from "../snackbars/loadingSnackbar";
import ImagesAlertSnackbar from "../snackbars/alertSnackbar";
import ImagesLoadingSnackbar from "../snackbars/loadingSnackbar";
import { closeAuthAlertSnackbar, closeAuthLoadingSnackbar, getAuthSnackbar } from "@/store/ui/authentication/authentication.slice";
import { Box } from "@mui/material";
import { Outlet } from "react-router";
import { closeContactAlertSnackbar, closeContactLoadingSnackbar, getContactSnackbar } from "@/store/ui/contact/contact.slice";
import { closeFriendshipsAlertSnackbar, closeFriendshipsLoadingSnackbar, getFriendshipsSnackbar } from "@/store/ui/friendships/friendships.slice";
import { closeFramesAlertSnackbar, closeFramesLoadingSnackbar, getFramesSnackbar } from "@/store/ui/frames/frames.slice";
import { closeImagesAlertSnackbar, closeImagesLoadingSnackbar, getImagesSnackbar } from "@/store/ui/images/images.slice";

export const Snackbars = () => {
    return (
        <Box>
            <Outlet />
            <AuthenticationAlertSnackbar
                getSnackbar={getAuthSnackbar}
                closeSnackbar={closeAuthAlertSnackbar}
            />
            <AuthenticationLoadingSnackbar
                getSnackbar={getAuthSnackbar}
                closeSnackbar={closeAuthLoadingSnackbar}
            />
            <ContactAlertSnackbar
                getSnackbar={getContactSnackbar}
                closeSnackbar={closeContactAlertSnackbar}
            />
            <ContactLoadingSnackbar
                getSnackbar={getContactSnackbar}
                closeSnackbar={closeContactLoadingSnackbar}
            />
            <FriendshipsAlertSnackbar
                getSnackbar={getFriendshipsSnackbar}
                closeSnackbar={closeFriendshipsAlertSnackbar}
            />
            <FriendshipsLoadingSnackbar
                getSnackbar={getFriendshipsSnackbar}
                closeSnackbar={closeFriendshipsLoadingSnackbar}
            />
            <FramesAlertSnackbar
                getSnackbar={getFramesSnackbar}
                closeSnackbar={closeFramesAlertSnackbar}
            />
            <FramesLoadingSnackbar
                getSnackbar={getFramesSnackbar}
                closeSnackbar={closeFramesLoadingSnackbar}
            />
            <ImagesAlertSnackbar
                getSnackbar={getImagesSnackbar}
                closeSnackbar={closeImagesAlertSnackbar}
            />
            <ImagesLoadingSnackbar
                getSnackbar={getImagesSnackbar}
                closeSnackbar={closeImagesLoadingSnackbar}
            />
        </Box>
    );
}

export default Snackbars;