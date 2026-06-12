import React from "react";
import Slide from "@mui/material/Slide";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertColor, AlertProps } from "@mui/material/Alert";
import { useAppDispatch, useAppSelector } from "@/store";


interface AlertSnackbar {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface IAlertSnackbarProps {
  getSnackbar: (state: any) => any;
  closeSnackbar: () => any;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="standard" {...props} />;
  }
);

const AlertSnackbar = (
  {
    getSnackbar,
    closeSnackbar,
  }: IAlertSnackbarProps
) => {

  const dispatch = useAppDispatch();

  const snackbar: AlertSnackbar = useAppSelector(getSnackbar).alert;

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    // Clicking anywhere outside the snackbar dismisses it (MUI clickaway). But the
    // copy buttons that *open* this snackbar are also "outside" it, so a copy click
    // would clickaway-close the very snackbar it just opened (toggle). Exempt any
    // element opting out via `.ignore-clickaway` (same pattern as sidebar.tsx).
    if (reason === 'clickaway') {
      const target = (event?.target ?? null) as HTMLElement | null;
      if (target?.closest('.ignore-clickaway')) return;
    }
    dispatch(closeSnackbar());
  };

  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      open={snackbar.open}
      autoHideDuration={10000}
      onClose={handleSnackbarClose}
      TransitionComponent={Slide}
      sx={{ justifySelf: "center" }}
    >
      <Alert
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
        sx={{ width: "100%" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}

export default AlertSnackbar