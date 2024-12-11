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

  const handleSnackbarClose = () => {
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