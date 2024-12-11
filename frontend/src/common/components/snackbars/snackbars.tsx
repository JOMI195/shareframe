import AuthenticationAlertSnackbar from "../snackbars/alertSnackbar";
import AuthenticationLoadingSnackbar from "../snackbars/loadingSnackbar";
import ContactAlertSnackbar from "../snackbars/alertSnackbar";
import ContactLoadingSnackbar from "../snackbars/loadingSnackbar";
import FriendshipsAlertSnackbar from "../snackbars/alertSnackbar";
import FriendshipsLoadingSnackbar from "../snackbars/loadingSnackbar";
import { closeAuthAlertSnackbar, closeAuthLoadingSnackbar, getAuthSnackbar } from "@/store/ui/authentication/authentication.slice";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { closeContactAlertSnackbar, closeContactLoadingSnackbar, getContactSnackbar } from "@/store/ui/contact/contact.slice";
import { closeFriendshipsAlertSnackbar, closeFriendshipsLoadingSnackbar, getSnackbar } from "@/store/ui/friendships/friendships.slice";

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
                getSnackbar={getSnackbar}
                closeSnackbar={closeFriendshipsAlertSnackbar}
            />
            <FriendshipsLoadingSnackbar
                getSnackbar={getSnackbar}
                closeSnackbar={closeFriendshipsLoadingSnackbar}
            />
        </Box>
    );
}

export default Snackbars;