import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { resetPassword } from "../../../store/entities/authentication/authentication.actions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { getIn, useFormik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { getHomeUrl } from "@/assets/endpoints/app/appEndpoints";
import { Grid } from "@mui/material";

export default function PasswordReset() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState({
    email: "",
  });

  const [isDisabled, setIsDisabled] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    let timerId: number | null = null;

    if (isDisabled) {
      timerId = window.setInterval(() => {
        setSecondsLeft(prevSeconds => {
          if (prevSeconds <= 1) {
            window.clearInterval(timerId!);
            setIsDisabled(false);
            return 30;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerId !== null) window.clearInterval(timerId);
    };
  }, [isDisabled]);

  const handleResetClick = () => {
    setIsDisabled(true);
  }

  const handleCancel = () => {
    navigate(getHomeUrl(), { replace: true });
    setIsDisabled(false);
  };

  const validationSchema = yup.object({
    email: yup
      .string()
      .email("Email muss gültig sein")
      .required("Dieses Feld wird benötigt" as string),
  });

  const resetPasswordForm = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: (values: any) => {
      handleResetClick();
      dispatch(resetPassword(values));
      setInitialValues({
        email: "",
      });
    },
  });

  return (
    <Box>
      <Typography component="h1" variant="h5" textAlign={"center"} gutterBottom>
        {"Passwort zurücksetzen"}
      </Typography>
      <Box
        component="form"
        id="reset-password-form"
        noValidate
        onSubmit={resetPasswordForm.handleSubmit}
        sx={{ mt: 3 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body1" textAlign={"center"}>
              {"Bitte gib deine Emailadresse ein und wir senden dir ein neues Passwort zu"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={12}>
            <TextField
              id="email"
              name="email"
              label={"Email"}
              value={resetPasswordForm.values.email}
              onBlur={resetPasswordForm.handleBlur}
              error={
                resetPasswordForm.touched.email &&
                Boolean(resetPasswordForm.errors.email)
              }
              helperText={
                getIn(resetPasswordForm.touched, "email") &&
                getIn(resetPasswordForm.errors, "email")
              }
              onChange={resetPasswordForm.handleChange}
              fullWidth
              autoComplete="email"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isDisabled}
            >
              {"Passwort zurücksetzen"}
            </Button>
            {isDisabled && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Typography variant="body2" component="span" textAlign={"center"}>
                  Bitte warte {secondsLeft} Sekunden um dein Passwort erneut zurückzusetzen
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} sm={12}>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
            >
              {"abbrechen"}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
