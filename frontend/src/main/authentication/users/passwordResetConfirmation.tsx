import React, { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { getIn, useFormik } from "formik";
import * as yup from "yup";

import {
  getAuthenticationUrl,
  getResetPasswordUrl,
  getSignInUrl,
  getUsersUrl,
} from "@/assets/endpoints/app/authEndpoints";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import { useAppDispatch, useAppSelector } from "@/store";
import { resetPasswordConfirm } from "@/store/entities/authentication/authentication.actions";
import { getApi } from "@/store/entities/authentication/authentication.slice";
import { PASSWORD_RULES } from "@/common/utils/constants/password";

export default function PasswordResetConfirmation() {
  const { uid, token } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState({
    new_password: false,
    re_new_password: false,
  });

  const { loading } = useAppSelector(getApi);
  const [failed, setFailed] = useState(false);

  const handleCancel = () => {
    navigate(getAuthenticationUrl() + getSignInUrl(), { replace: true });
  };

  const handleClickShowPassword = (key: keyof typeof showPassword) => {
    setShowPassword({ ...showPassword, [key]: !showPassword[key] });
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const [initialValues] = useState({
    uid: uid as string,
    token: token as string,
    new_password: "",
    re_new_password: "",
  });

  const validationSchema = yup.object({
    new_password: yup
      .string()
      .required("Dieses Feld wird benötigt" as string)
      .min(
        8,
        "Dein Passwort muss mindestens 8 Zeichen enthalten" as string
      )
      .max(
        50,
        "Dein Passwort darf maximal 50 Zeichen enthalten" as string
      )
      .matches(
        /^(?=.*[0-9])(?=.*[a-zA-Z])(?=\S+$).{8,50}$/,
        "Dein Passwort muss mindestens einen Buchstaben und eine Zahl enthalten" as string
      ),
    re_new_password: yup
      .string()
      .required("Dieses Feld wird benötigt." as string)
      .oneOf([yup.ref("new_password")], "Passwörter müssen gleich sein" as string),
  });

  const resetPasswordForm = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setFailed(false);
      const changed: unknown = await dispatch(resetPasswordConfirm(values));
      if (changed === true) {
        navigate(getAuthenticationUrl() + getSignInUrl(), { replace: true });
      } else {
        setFailed(true);
      }
    },
  });

  return (
    <Box>
      <Typography component="h1" variant="h5" sx={{
        textAlign: "center"
      }}>
        {"Neues Passwort vergeben"}
      </Typography>
      <Box
        component="form"
        id="password-reset-form"
        noValidate
        onSubmit={resetPasswordForm.handleSubmit}
        sx={{ mt: 3 }}
      >
        <Grid container spacing={2}>
          <Grid size={12}>
            <Typography variant="body1" sx={{
              textAlign: "center"
            }}>
              {"Vergib ein neues Passwort für dein Konto."}
            </Typography>
          </Grid>
          {failed && (
            <Grid size={12}>
              <Alert severity="error">
                Das neue Passwort konnte nicht gespeichert werden. Vielleicht ist der Link abgelaufen.{" "}
                <Link component={RouterLink} to={getAuthenticationUrl() + getUsersUrl() + getResetPasswordUrl()}>
                  Neuen Link anfordern
                </Link>
              </Alert>
            </Grid>
          )}
          <Grid size={12}>
            <TextField
              id="new_password"
              name="new_password"
              label={"Neues Passwort"}
              value={resetPasswordForm.values.new_password}
              onBlur={resetPasswordForm.handleBlur}
              error={
                resetPasswordForm.touched.new_password &&
                Boolean(resetPasswordForm.errors.new_password)
              }
              helperText={
                (getIn(resetPasswordForm.touched, "new_password") &&
                  getIn(resetPasswordForm.errors, "new_password")) || PASSWORD_RULES
              }
              onChange={resetPasswordForm.handleChange}
              fullWidth
              autoComplete="new-password"
              variant="outlined"
              required
              type={showPassword.new_password ? "text" : "password"}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={`Neues Passwort ${showPassword.new_password ? "verbergen" : "anzeigen"}`}
                        onClick={() => handleClickShowPassword("new_password")}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword.new_password ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              id="re_new_password"
              name="re_new_password"
              label={"Passwort wiederholen"}
              value={resetPasswordForm.values.re_new_password}
              onBlur={resetPasswordForm.handleBlur}
              error={
                resetPasswordForm.touched.re_new_password &&
                Boolean(resetPasswordForm.errors.re_new_password)
              }
              helperText={
                getIn(resetPasswordForm.touched, "re_new_password") &&
                getIn(resetPasswordForm.errors, "re_new_password")
              }
              onChange={resetPasswordForm.handleChange}
              fullWidth
              autoComplete="new-password"
              variant="outlined"
              required
              type={showPassword.re_new_password ? "text" : "password"}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={`Passwort wiederholen ${showPassword.re_new_password ? "verbergen" : "anzeigen"}`}
                        onClick={() => handleClickShowPassword("re_new_password")}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword.re_new_password ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
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
              form="password-reset-form"
              variant="contained"
              loading={loading}
            >
              {"Passwort neu vergeben"}
            </Button>
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
              {"Abbrechen"}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
