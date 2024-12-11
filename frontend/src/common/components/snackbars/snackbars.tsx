import AuthenticationAlertSnackbar from "../snackbars/alertSnackbar";
import AuthenticationLoadingSnackbar from "../snackbars/loadingSnackbar";
import ContactAlertSnackbar from "../snackbars/alertSnackbar";
import ContactLoadingSnackbar from "../snackbars/loadingSnackbar";
import { closeAuthAlertSnackbar, closeAuthLoadingSnackbar, getAuthSnackbar } from "@/store/ui/authentication/authentication.slice";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { closeContactAlertSnackbar, closeContactLoadingSnackbar, getContactSnackbar } from "@/store/ui/contact/contact.slice";

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
        </Box>
    );
}

export default Snackbars;