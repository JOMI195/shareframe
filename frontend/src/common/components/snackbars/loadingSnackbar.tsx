import { useState } from "react";
import Slide from "@mui/material/Slide";
import { StackedSnackbar } from "./snackbarStack";
import { RootState, useAppDispatch, useAppSelector } from "@/store";
import { UnknownAction } from "redux";
import { CircularProgress, Paper, Typography } from "@mui/material";
import { useColorThemeContext } from "@/context/colorTheme/colorThemeContextValue";
import { useDelayedLoading } from "@/hooks/loading/useDelayedLoading";


interface LoadingSnackbar {
    open: boolean;
    message: string;
}

interface ILoadingSnackbarProps {
    getSnackbar: (state: RootState) => { loading: LoadingSnackbar };
    closeSnackbar: () => UnknownAction;
}

const LoadingSnackbar = (
    {
        getSnackbar,
        closeSnackbar,
    }: ILoadingSnackbarProps
) => {

    const dispatch = useAppDispatch();
    const { colorMode } = useColorThemeContext();

    const snackbar: LoadingSnackbar = useAppSelector(getSnackbar).loading;
    const open = useDelayedLoading(snackbar.open);
    // The slices clear the text on close, while the snackbar is still sliding out.
    const [shownMessage, setShownMessage] = useState(snackbar.message);
    if (snackbar.message && snackbar.message !== shownMessage) setShownMessage(snackbar.message);

    const handleSnackbarClose = () => {
        dispatch(closeSnackbar());
    };

    return (
        <StackedSnackbar
            open={open}
            onClose={handleSnackbarClose}
            autoHideDuration={30000}
            slots={{
                transition: Slide
            }}
            slotProps={{
                clickAwayListener: { onClickAway: () => null }
            }}
        >
            <Paper
                role="status"
                elevation={5}
                sx={{
                    py: 1.5,
                    px: 3,
                    display: 'flex',
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexDirection: "row",
                    background: (theme) => colorMode === "light" ? theme.palette.common.black : theme.palette.common.white,
                    color: (theme) => colorMode === "light" ? theme.palette.common.white : theme.palette.common.black,
                }}
            >
                <CircularProgress
                    color="inherit"
                    size="1.1rem"
                />
                <Typography variant="subtitle2" sx={{ ml: 5 }}>{shownMessage}</Typography>
            </ Paper>
        </StackedSnackbar>
    );
}

export default LoadingSnackbar