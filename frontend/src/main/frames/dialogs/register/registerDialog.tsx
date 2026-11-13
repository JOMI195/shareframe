import React, { useEffect } from "react";
import { useSearchParams } from "react-router";
import AppDialog from '@/common/components/appDialog';
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import { useFormik, getIn } from "formik";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { IRegisterFrameForm, isIFrameResponse } from "@/types";
import { Box, Grid, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { closeRegisterFrameDialog, getDialogs, openRegisterFrameDialog } from "@/store/ui/frames/frames.slice";
import { registerFrame } from "@/store/entities/frames/frames.actions";
import DialogHeader from '@/common/components/dialogHeader';
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import { formatClaimCode } from "./claimCode";

const RegisterFrameDialog: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const { open, code } = useAppSelector(getDialogs).register;
  const [searchParams, setSearchParams] = useSearchParams();
  const codeFromLink = searchParams.get("code");

  // The QR code on the frame's panel links here with its claim code.
  useEffect(() => {
    if (codeFromLink === null) return;
    dispatch(openRegisterFrameDialog({ code: formatClaimCode(codeFromLink) }));
    setSearchParams((params) => {
      params.delete("code");
      return params;
    }, { replace: true });
  }, [codeFromLink, dispatch, setSearchParams]);

  const matches = useMediaQuery(theme.breakpoints.up('sm'));

  const initialValues: IRegisterFrameForm = { claim_code: code };

  const validationSchema = yup.object({
    claim_code: yup
      .string()
      .required("Dieses Feld wird benötigt" as string)
      .matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Der Code muss das Format K7M2-QX9P haben" as string),
  });

  const form = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values: IRegisterFrameForm) => {
      const newFrame = await dispatch(registerFrame(values.claim_code));
      if (isIFrameResponse(newFrame)) {
        dispatch(closeRegisterFrameDialog());
        form.resetForm();
      }
    },
  });

  const handleDialogClose = () => {
    dispatch(closeRegisterFrameDialog());
    form.resetForm();
  };

  return (
    <AppDialog
      fullScreen={matches ? false : true}
      open={open}
      onClose={handleDialogClose}
      aria-labelledby='register-frame-title'
      maxWidth="xs"
      fullWidth
      slots={{
        transition: matches ? ZoomTransition : SlideTransition
      }}
    >
      <DialogHeader title="Bilderrahmen hinzufügen" titleId="register-frame-title" onClose={handleDialogClose} />
      <DialogContent>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          p: 2
        }}>
          <Stack spacing={2}>
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              Scanne den QR-Code auf deinem Bilderrahmen oder gib den Code ein, den er anzeigt.
              Zeigt er keinen Code, starte ihn neu.
            </Typography>
            <Box
              component='form'
              id='register-frame-form'
              noValidate
              onSubmit={form.handleSubmit}
              sx={{ mt: 3 }}
            >
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    id='frame_claim_code'
                    name='claim_code'
                    autoComplete="off"
                    label="Code"
                    value={form.values.claim_code}
                    onBlur={form.handleBlur}
                    onChange={(e) => form.setFieldValue('claim_code', formatClaimCode(e.target.value))}
                    error={form.touched.claim_code && Boolean(form.errors.claim_code)}
                    helperText={
                      (getIn(form.touched, "claim_code") && getIn(form.errors, "claim_code")) ||
                      "Steht auf dem Display des Bilderrahmens, Format XXXX-XXXX"
                    }
                    fullWidth
                    variant='outlined'
                    slotProps={{
                      htmlInput: {
                        style: { textTransform: 'uppercase' },
                        autoCapitalize: 'characters',
                        autoCorrect: 'off',
                        spellCheck: false,
                      }
                    }}
                  />
                </Grid>
                <Grid size={12}>
                  <Button
                    type='submit'
                    fullWidth
                    form='register-frame-form'
                    variant='contained'
                    loading={form.isSubmitting}
                  >
                    {'Hinzufügen'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
    </AppDialog>
  );
};

export default RegisterFrameDialog;
