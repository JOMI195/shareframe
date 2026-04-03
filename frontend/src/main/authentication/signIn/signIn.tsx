import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  authenticateUser,
  loadMyUserProfile,
} from "@/store/entities/authentication/authentication.actions";
import {
  getApi,
  getUser,
} from "@/store/entities/authentication/authentication.slice";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import { useNavigate } from "react-router";
import * as yup from "yup";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ClearIcon from '@mui/icons-material/Clear';

import { useAppSelector } from "@/store";
import {
  getAuthenticationUrl,
  getResetPasswordUrl,
  getUsersUrl,
} from "@/assets/endpoints/app/authEndpoints";
import { getHomeUrl } from "@/assets/endpoints/app/appEndpoints";
import { getIn, useFormik } from "formik";
import { Alert } from "@mui/material";
import { ICoreUserCredentials, isICoreUserCredentials } from "@/types";

export default function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const api = useAppSelector(getApi);
  const user = useAppSelector(getUser);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (errorMessage) {
      timer = setTimeout(() => {
        setErrorMessage("");
      }, 10000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [errorMessage]);

  useEffect(() => {
    if (localStorage.getItem("loggedIn") === "true") {
      setErrorMessage("");
      dispatch(loadMyUserProfile());
      navigate(getHomeUrl());
    }
  }, [user]);

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClearEmail = () => {
    signInForm.setFieldValue("email", "");
  };

  const handleMouseDownButton = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const [initialValues] = useState({
    email: "",
    password: "",
  });

  const validationSchema = yup.object({
    email: yup
      .string()
      .required("Dieses Feld wird benötigt" as string),
    password: yup
      .string()
      .required("Dieses Feld wird benötigt" as string),
  });

  const signInForm = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values: any) => {
      const response: any = await dispatch(authenticateUser(values));
      const newCredentials = response as ICoreUserCredentials;
      if (!isICoreUserCredentials(newCredentials)) {
        setErrorMessage("Bitte überprüfe deine E-Mail-Adresse und dein Passwort auf Tippfehler (Groß-/ Kleinschreibung beachten). Falls dein Konto noch nicht aktiviert wurde, prüfe bitte deine E-Mails auf die Aktivierungsmail. Versuche es anschließend erneut. Bei wiederholten Problemen kontaktiere bitte unseren Support.");
      }
      signInForm.resetForm();
    },
  });

  return (
    <Box>
      <Typography component="h1" variant="h5" textAlign={"center"}>
        {"Anmelden"}
      </Typography>
      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      <Box
        component="form"
        id="sign-in-form"
        noValidate
        onSubmit={signInForm.handleSubmit}
        sx={{ mt: 3 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="email"
              name="email"
              label={"Email"}
              value={signInForm.values.email}
              onBlur={signInForm.handleBlur}
              error={
                signInForm.touched.email && Boolean(signInForm.errors.email)
              }
              helperText={
                getIn(signInForm.touched, "email") &&
                getIn(signInForm.errors, "email")
              }
              onChange={signInForm.handleChange}
              fullWidth
              autoComplete="email"
              variant="outlined"
              InputProps={{
                endAdornment: signInForm.values.email ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="clear email field"
                      onClick={handleClearEmail}
                      onMouseDown={handleMouseDownButton}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="password"
              name="password"
              label={"Passwort"}
              value={signInForm.values.password}
              onBlur={signInForm.handleBlur}
              error={
                signInForm.touched.password &&
                Boolean(signInForm.errors.password)
              }
              helperText={
                getIn(signInForm.touched, "password") &&
                getIn(signInForm.errors, "password")
              }
              onChange={signInForm.handleChange}
              fullWidth
              autoComplete="password"
              variant="outlined"
              type={showPassword ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle current password visibility"
                      onClick={() => handleClickShowPassword()}
                      onMouseDown={handleMouseDownButton}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              form="sign-in-form"
              fullWidth
              variant="contained"
              disabled={api.loading}
            >
              {"anmelden"}
            </Button>
          </Grid>
          <Grid item xs={12} display="flex" justifyContent="center">
            <Link
              component={RouterLink}
              to={
                getAuthenticationUrl() + getUsersUrl() + getResetPasswordUrl()
              }
              variant="body2"
            >
              {"Passwort vergessen?"}
            </Link>
            {/* <Link
              component={RouterLink}
              to={getAuthenticationUrl() + getSignUpUrl()}
              variant="body2"
            >
              {"Kein Konto? Registriere dich"}
            </Link> */}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
