import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Zoom from "@mui/material/Zoom";
import { TransitionProps } from "@mui/material/transitions";
import { useFormik, getIn } from "formik";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store";
import { IRegisterFrameForm, isIFrameResponse } from "@/types";
import { Box, Grid, Stack, TextField, Typography } from "@mui/material";
import { closeRegisterFrameDialog, getDialogs } from "@/store/ui/frames/frames.slice";
import { registerFrame } from "@/store/entities/frames/frames.actions";

const ZoomTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Zoom ref={ref} {...props} />;
});

const RegisterFrameDialog: React.FC = () => {
  const dispatch = useAppDispatch();

  const open = useAppSelector(getDialogs).register.open;

  const [initialValues] = useState<IRegisterFrameForm>({
    public_serial_number: "",
  });

  const validationSchema = yup.object({
    public_serial_number: yup
      .string()
      .required("Dieses Feld wird benötigt" as string)
      .matches(
        /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/,
        "Der Code muss das Format EOJ8W-XBVY8-6U3LL-39I2F-1HUCU haben" as string
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
    <Dialog
      open={open}
      onClose={handleDialogClose}
      TransitionComponent={ZoomTransition}
      aria-labelledby="register-frame-dialog"
      fullWidth
      maxWidth="xs"
    >
      <DialogContent>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          p: 2
        }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Bilderrahmen hinzufügen
            </Typography>
            <Typography variant="body2" color="text.secondary">
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
                <Grid item xs={12}>
                  <TextField
                    id='friend_code'
                    name='public_serial_number'
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
                    inputProps={{
                      style: { textTransform: 'uppercase' }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type='submit'
                    fullWidth
                    form='register-frame-form'
                    variant='contained'
                  >
                    {'Hinzufügen'}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={12}>
                  <Button
                    type="button"
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    onClick={handleDialogClose}
                  >
                    {"abbrechen"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterFrameDialog;
