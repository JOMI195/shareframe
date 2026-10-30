import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { resetPassword } from "../../../store/entities/authentication/authentication.actions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { getIn, useFormik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";
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
    navigate(getAuthenticationUrl() + getSignInUrl(), { replace: true });
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
    onSubmit: (values) => {
      handleResetClick();
      dispatch(resetPassword(values));
      setInitialValues({
        email: "",
      });
    },
  });

  return (
    <Box>
      <Typography component="h1" variant="h5" gutterBottom sx={{
        textAlign: "center"
      }}>
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
          <Grid size={12}>
            <Typography variant="body1" sx={{
              textAlign: "center"
            }}>
              {"Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort vergeben kannst."}
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 12
            }}>
            <TextField
              id="email"
              name="email"
              type="email"
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
          <Grid
            size={{
              xs: 12,
              sm: 12
            }}>
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
                <Typography variant="body2" component="span" sx={{
                  textAlign: "center"
                }}>
                  Du kannst in {secondsLeft} Sekunden einen weiteren Link anfordern.
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 12
            }}>
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
