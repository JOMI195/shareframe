import React, { useEffect, useState } from "react";
import AppDialog from '@/common/components/appDialog';
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import { useAppDispatch, useAppSelector } from "@/store";
import { Box, Grid, IconButton, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { closeRequestOTPDialog, getDialogs, openFramesAlertSnackbar } from "@/store/ui/frames/frames.slice";
import DialogHeader from '@/common/components/dialogHeader';
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
        ? { message: "Einmal-Code kopiert", severity: "success" }
        : { message: "Kopieren fehlgeschlagen", severity: "error" }
    ));
  };

  useEffect(() => {
    if (expiresIn === null || expiresIn <= 0) return;

    const timer = setInterval(() => {
      const remaining = expiresIn - 60;
      if (remaining <= 0) {
        setOtp('');
        setExpiresIn(null);
        setExpiresDisplay('');
        return;
      }
      setExpiresIn(remaining);
      setExpiresDisplay(`${Math.ceil(remaining / 60)}`);
    }, 60000);

    return () => clearInterval(timer);
  }, [expiresIn]);

  return (
    <AppDialog
      fullScreen={matches ? false : true}
      open={dialog.open}
      onClose={handleDialogClose}
      aria-labelledby='request-otp-title'
      maxWidth="xs"
      fullWidth
      slots={{
        transition: matches ? ZoomTransition : SlideTransition
      }}
    >
      <DialogHeader title="Einmal-Code für die Einstellungen" titleId="request-otp-title" onClose={handleDialogClose} />
      <DialogContent>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 1
        }}>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Mit diesem Code meldest du dich in den Einstellungen deines Bilderrahmens an. Öffne sie über „Öffnen“ auf der Karte des Rahmens, im selben WLAN.
          </Typography>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Der Code gilt nur kurz und ist nur sichtbar, solange dieses Fenster offen ist. Du kannst jederzeit einen neuen erstellen.
          </Typography>
          <Grid
            container
            spacing={2}
            sx={{
              pt: 2,
              alignItems: "center"
            }}>
            {otp && expiresDisplay && (
              <Grid size={12}>
                <Typography variant="body1" color="error">
                  Noch {expiresDisplay} {expiresDisplay === "1" ? "Minute" : "Minuten"} gültig
                </Typography>
              </Grid>
            )}
            <Grid size={10}>
              <TextField
                id='otp'
                name='otp'
                label='Einmal-Code'
                value={otp}
                slotProps={{ htmlInput: { readOnly: true } }}
                fullWidth
                variant='outlined'
              />
            </Grid>
            <Grid size={2}>
              <Tooltip
                title='Code kopieren'
              >
                <span>
                  <IconButton onClick={handleCopyOtp} disabled={!otp} aria-label="Code kopieren" className="ignore-clickaway">
                    <ContentCopyIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
          <Grid
            container
            spacing={1}
            sx={{
              pt: 2,
              alignItems: "center"
            }}>
            <Grid size={12}>
              <Button
                fullWidth
                variant='contained'
                disabled={loading}
                onClick={async () => frame !== undefined ? await handleGenerateFrameOtp(frame.id) : null}
              >
                {otp ? 'Neuen Code erstellen' : 'Code erstellen'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </AppDialog>
  );
};

export default RequestOTPDialog;