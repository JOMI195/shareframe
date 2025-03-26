import { Box, Stack } from "@mui/material";
import ViewerAlertSnackbar from "../snackbars/alertSnackbar";
import ViewerLoadingSnackbar from "../snackbars/loadingSnackbar";
import { useAppSelector, useAppDispatch } from "@/store";
import { AlertColor } from '@mui/material';
import { getSnackbars, removeAlertSnackbar, removeLoadingSnackbar } from '@/store/snackbars/snackbars.Slice';
import { ReactNode } from "react";

interface SnackbarsProps {
    children: ReactNode;
}

interface SnackbarItem {
    id: string;
    message: string;
}

interface AlertSnackbarItem extends SnackbarItem {
    severity: AlertColor;
}

function isAlertSnackbar(snackbar: SnackbarItem | AlertSnackbarItem): snackbar is AlertSnackbarItem {
    return 'severity' in snackbar;
}

export const Snackbars: React.FC<SnackbarsProps> = ({ children }) => {
    const dispatch = useAppDispatch();
    const snackbars = useAppSelector(getSnackbars);

    const handleCloseAlert = (id: string) => {
        dispatch(removeAlertSnackbar(id));
    };

    const handleCloseLoading = (id: string) => {
        dispatch(removeLoadingSnackbar(id));
    };

    const allSnackbars = [...snackbars.alerts, ...snackbars.loading]
        .sort((a, b) => b.id.localeCompare(a.id));

    return (
        <Box>
            {children}
            <Stack
                sx={{
                    position: "fixed",
                    bottom: (theme) => theme.layout.footer.height,
                    right: 24,
                    maxWidth: "calc(100% - 48px)",
                    zIndex: 9999,
                    width: "fit-content", // Adjusts width based on content
                    alignItems: "flex-end",
                }}
                spacing={2} // Stack spacing for spacing between snackbars
            >
                {allSnackbars.map((snackbar) => (
                    <Box key={snackbar.id}>
                        {isAlertSnackbar(snackbar) ? (
                            <ViewerAlertSnackbar
                                snackbar={snackbar}
                                closeSnackbar={() => handleCloseAlert(snackbar.id)}
                            />
                        ) : (
                            <ViewerLoadingSnackbar
                                snackbar={snackbar}
                                closeSnackbar={() => handleCloseLoading(snackbar.id)}
                            />
                        )}
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};

export default Snackbars;