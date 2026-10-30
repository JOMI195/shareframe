import React, { useState } from "react";
import AppDialog from '@/common/components/appDialog';
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import { useFormik, getIn } from "formik";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { IRegisterFrameForm, isIFrameResponse } from "@/types";
import { Box, Grid, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { closeRegisterFrameDialog, getDialogs } from "@/store/ui/frames/frames.slice";
import { registerFrame } from "@/store/entities/frames/frames.actions";
import DialogHeader from '@/common/components/dialogHeader';
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";

const RegisterFrameDialog: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const open = useAppSelector(getDialogs).register.open;

  const matches = useMediaQuery(theme.breakpoints.up('sm'));

  const [initialValues] = useState<IRegisterFrameForm>({
    public_serial_number: "",
  });

  const validationSchema = yup.object({
    public_serial_number: yup
      .string()
      .required("Dieses Feld wird benötigt" as string)
      .matches(
        /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
        "Der Code muss das Format EOJ8-WXBV-Y86U-3LL3 haben" as string
      )
    ,
  });

  const form = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values: IRegisterFrameForm) => {
      const newFrame = await dispatch(registerFrame(values.public_serial_number));
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
              Bitte gebe hier die Seriennummer des Bilderrahmens ein, welchen du hinzufügen möchtest
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
                    id='frame_serial'
                    name='public_serial_number'
                    autoComplete="off"
                    label="Seriennummer"
                    value={form.values.public_serial_number}
                    onBlur={form.handleBlur}
                    onChange={(e) => {
                      const uppercaseValue = e.target.value.toUpperCase();
                      form.setFieldValue('public_serial_number', uppercaseValue);
                    }}
                    error={
                      form.touched.public_serial_number &&
                      Boolean(form.errors.public_serial_number)
                    }
                    helperText={
                      getIn(form.touched, "public_serial_number") &&
                      getIn(form.errors, "public_serial_number")
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
