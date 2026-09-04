import Slide from "@mui/material/Slide";
import Snackbar from "@mui/material/Snackbar";
import { RootState, useAppDispatch, useAppSelector } from "@/store";
import { UnknownAction } from "redux";
import { CircularProgress, Paper, Typography } from "@mui/material";
import { useColorThemeContext } from "@/context/colorTheme/colorThemeContextValue";


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

    const handleSnackbarClose = () => {
        dispatch(closeSnackbar());
    };

    return (
        <Snackbar
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            open={snackbar.open}
            onClose={handleSnackbarClose}
            autoHideDuration={30000}
            sx={{ justifySelf: "center" }}
            slots={{
                transition: Slide
            }}
            slotProps={{
                clickAwayListener: { onClickAway: () => null }
            }}
        >
            <Paper
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
                <Typography variant="subtitle2" sx={{ ml: 5 }}>{snackbar.message}</Typography>
            </ Paper>
        </Snackbar>
    );
}

export default LoadingSnackbar