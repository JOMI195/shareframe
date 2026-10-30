import React from "react";
import Slide from "@mui/material/Slide";
import { StackedSnackbar } from "./snackbarStack";
import MuiAlert, { AlertColor, AlertProps } from "@mui/material/Alert";
import { RootState, useAppDispatch, useAppSelector } from "@/store";
import { UnknownAction } from "redux";
import Button from "@mui/material/Button";
import { Link as RouterLink } from "react-router";

export interface SnackbarLink {
  label: string;
  to: string;
}

interface AlertSnackbar {
  open: boolean;
  message: string;
  severity: AlertColor;
  link?: SnackbarLink;
}

interface IAlertSnackbarProps {
  getSnackbar: (state: RootState) => { alert: AlertSnackbar };
  closeSnackbar: () => UnknownAction;
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
    <StackedSnackbar
      open={snackbar.open}
      // Errors stay until dismissed, so there is time to read them.
      autoHideDuration={snackbar.severity === 'error' ? null : 10000}
      onClose={handleSnackbarClose}
      slots={{
        transition: Slide
      }}
    >
      <Alert
        severity={snackbar.severity}
        onClose={snackbar.link ? undefined : handleSnackbarClose}
        action={snackbar.link && (
          <Button color="inherit" size="small" component={RouterLink} to={snackbar.link.to} onClick={() => dispatch(closeSnackbar())}>
            {snackbar.link.label}
          </Button>
        )}
        sx={{ width: "100%" }}
      >
        {snackbar.message}
      </Alert>
    </StackedSnackbar>
  );
}

export default AlertSnackbar