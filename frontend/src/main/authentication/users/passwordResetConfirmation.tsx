import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  getSignInUrl,
} from "@/assets/endpoints/app/authEndpoints";
import { useAppDispatch } from "@/store";
import { resetPasswordConfirm } from "@/store/entities/authentication/authentication.actions";
import { getHomeUrl } from "@/assets/endpoints/app/appEndpoints";

export default function PasswordResetConfirmation() {
  const { uid, token } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState({
    new_password: false,
    re_new_password: false,
  });

  const handleCancel = () => {
    navigate(getHomeUrl(), { replace: true });
  };

  const handleClickShowPassword = (key: keyof typeof showPassword) => {
    setShowPassword({ ...showPassword, [key]: !showPassword[key] });
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  useEffect(() => {
    setInitialValues({
      uid: uid as string,
      token: token as string,
      new_password: "",
      re_new_password: "",
    });
  }, []);

  const [initialValues, setInitialValues] = useState({
    uid: "",
    token: "",
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
    enableReinitialize: true,
    onSubmit: (values: any) => {
      navigate(getAuthenticationUrl() + getSignInUrl(), { replace: true });
      dispatch(resetPasswordConfirm(values));
      setInitialValues({
        uid: "",
        token: "",
        new_password: "",
        re_new_password: "",
      });
    },
  });

  return (
    <Box>
      <Typography component="h1" variant="h5" textAlign={"center"}>
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
          <Grid item xs={12}>
            <Typography variant="body1" textAlign={"center"}>
              {"Bitte vergebe ein neues Passwort um dein altes zurückzusetzen"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
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
                getIn(resetPasswordForm.touched, "new_password") &&
                getIn(resetPasswordForm.errors, "new_password")
              }
              onChange={resetPasswordForm.handleChange}
              fullWidth
              autoComplete="new_password"
              variant="outlined"
              required
              type={showPassword.new_password ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle current new_password visibility"
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
              }}
            />
          </Grid>
          <Grid item xs={12}>
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
              autoComplete="re_new_password"
              variant="outlined"
              required
              type={showPassword.new_password ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle current new_password visibility"
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
              }}
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <Button
              type="submit"
              fullWidth
              form="password-reset-form"
              variant="contained"
            >
              {"Passwort neu vergeben"}
            </Button>
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
