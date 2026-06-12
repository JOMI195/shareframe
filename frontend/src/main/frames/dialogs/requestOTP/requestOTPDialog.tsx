import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { useAppDispatch, useAppSelector } from "@/store";
import { AppBar, Box, DialogTitle, Grid, IconButton, TextField, Toolbar, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { closeRequestOTPDialog, getDialogs, openFramesAlertSnackbar } from "@/store/ui/frames/frames.slice";
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import { obtainFrameOTP } from "@/store/entities/frames/frames.actions";
import { getApi, getFrames } from "@/store/entities/frames/frames.slice";
import { IFrame, isIFrameOTP } from "@/types";
import { copyToClipboard } from "@/common/utils/clipboard/clipboard";

const RequestOTPDialog: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const dialog = useAppSelector(getDialogs).requestOTP;
  const frames: IFrame[] = useAppSelector(getFrames);
  const api = useAppSelector(getApi);
  const loading = api.loading || api.otpLoading;
  const frame = frames.find((frame) => frame.id === dialog.frameId) as IFrame | undefined;

  const matches = useMediaQuery(theme.breakpoints.up('sm'));

  const [otp, setOtp] = useState('');
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [expiresDisplay, setExpiresDisplay] = useState('');

  const handleDialogClose = () => {
    dispatch(closeRequestOTPDialog());
    clearDialog();
  };

  const handleGenerateFrameOtp = async (frame_id: number) => {
    const otpResponse = await dispatch(obtainFrameOTP(frame_id));
    if (isIFrameOTP(otpResponse)) {
      setOtp(otpResponse.otp);
      const expiresSeconds = Number(otpResponse.expires_in_minutes) * 60;
      setExpiresIn(expiresSeconds);
      setExpiresDisplay(otpResponse.expires_in_minutes);
    }
  };

  const clearDialog = () => {
    setOtp('');
    setExpiresIn(null);
    setExpiresDisplay('');
  }

  const handleCopyOtp = async () => {
    const ok = await copyToClipboard(otp);
    dispatch(openFramesAlertSnackbar(
      ok
        ? { message: "OTP in die Zwischenablage kopiert", severity: "success" }
        : { message: "Kopieren fehlgeschlagen", severity: "error" }
    ));
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expiresIn !== null && expiresIn > 0) {
      timer = setInterval(() => {
        setExpiresIn((prev) => (prev !== null ? prev - 60 : null));
        const minutes = Math.ceil((expiresIn ?? 0) / 60);
        setExpiresDisplay(`${minutes}`);
      }, 60000);
    } else if (expiresIn !== null && expiresIn <= 0) {
      setOtp('');
      setExpiresIn(null);
      setExpiresDisplay('');
    }
    return () => clearInterval(timer);
  }, [expiresIn]);

  return (
    <Dialog
      fullScreen={matches ? false : true}
      open={dialog.open}
      TransitionComponent={matches ? ZoomTransition : SlideTransition}
      onClose={handleDialogClose}
      aria-describedby='dialog-slide-upload'
      maxWidth="xs"
      fullWidth
    >
      {!matches ? (
        <AppBar sx={{ position: 'relative' }} color='inherit'>
          <Toolbar>
            <IconButton
              edge='start'
              color='inherit'
              onClick={handleDialogClose}
              aria-label='cancel'
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
              OTP generieren
            </Typography>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle>OTP generieren</DialogTitle>
      )}
      <DialogContent>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            Generiere ein OTP (One-Time-Password), welches du für bestimmte Authentifizierungen mit deinem Bilderrahmen nutzen kannst.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Beachte, dass das OTP nur eine kurze Zeit gültig und nur während der Öffnung dieses Dialogs sichtbar ist.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Du kannst jederzeit ein neues OTP generieren.
          </Typography>
          <Grid container pt={2} spacing={2} alignItems="center">
            {otp && expiresDisplay && (
              <Grid item xs={12}>
                <Typography variant="body1" color="error">
                  gültig für: {expiresDisplay} Minuten
                </Typography>
              </Grid>
            )}
            <Grid item xs={10}>
              <TextField
                id='otp'
                name='otp'
                label='OTP'
                disabled
                value={otp}
                fullWidth
                variant='outlined'
              />
            </Grid>
            <Grid item xs={2}>
              <Tooltip
                title='OTP in die Zwischenablage kopieren'
              >
                <span>
                  <IconButton onClick={handleCopyOtp} disabled={!otp} aria-label="copy otp" className="ignore-clickaway">
                    <ContentCopyIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
          <Grid container pt={2} spacing={1} alignItems="center">
            <Grid item xs={12}>
              <Button
                fullWidth
                variant='contained'
                disabled={loading}
                onClick={async () => frame !== undefined ? await handleGenerateFrameOtp(frame.id) : null}
              >
                {'Generieren'}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                type="button"
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={handleDialogClose}
              >
                {"Abbrechen"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RequestOTPDialog;