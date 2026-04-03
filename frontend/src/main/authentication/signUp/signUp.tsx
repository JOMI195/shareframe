import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import { Link as RouterLink, useNavigate } from "react-router";
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
  signUpUser,
} from "@/store/entities/authentication/authentication.actions";
import { useAppDispatch } from "@/store";
import {
  getAuthenticationUrl,
  getSignInUrl,
  getSignUpConfirmationUrl,
  getUsersUrl,
} from "@/assets/endpoints/app/authEndpoints";
import { getHomeUrl } from "@/assets/endpoints/app/appEndpoints";
import { ICoreUser, isICoreUser } from "@/types";
import { Alert } from "@mui/material";

export default function SignUp() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState({
    current_password: false,
    new_password: false,
  });

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

  const handleClickShowPassword = (key: keyof typeof showPassword) => {
    setShowPassword({ ...showPassword, [key]: !showPassword[key] });
  };

  const handleCancel = () => {
    navigate(getHomeUrl(), { replace: true });
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const [initialValues] = useState({
    email: "",
    username: "",
    password: "",
    re_password: "",
  });

  const validationSchema = yup.object({
    username: yup
      .string()
      .strict(true)
      .trim("Der Nutzername darf keine Leerzeichen enthalten")
      .min(1, "Dein Nutzername muss mindestens Zeichen enthalten" as string)
      .max(
        50,
        "Dein Nutzername darf maximal 50 Zeichen enthalten" as string
      )
      .required("Dieses Feld wird benötigt" as string),
    email: yup
      .string()
      .email("Email muss gültig sein")
      .required("Dieses Feld wird benötigt" as string),
    password: yup
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
    re_password: yup
      .string()
      .required("Dieses Feld wird benötigt." as string)
      .oneOf([yup.ref("password")], "Passwörter müssen gleich sein" as string),
  });

  const signUpForm = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values: any) => {
      const response: any = await dispatch(signUpUser(values));
      const newUser = response as ICoreUser
      if (isICoreUser(newUser)) {
        setErrorMessage("");
        navigate(
          getAuthenticationUrl() + getUsersUrl() + getSignUpConfirmationUrl(),
          { replace: true, state: { resendActivationTo: signUpForm.values.email } }
        );
      } else {
        setErrorMessage("Möglicherweise existiert die Email/ Nutzername bereits oder es gab ein Problem mit der Aktivierungs-Mail. Bitte überprüfe deine Emailadresse und versuche es erneut. Bei wiederholtem Fehler versuche es in 24 Stunden erneut oder kontaktiere den Support.");
      }
      signUpForm.resetForm();
    },
  });

  return (
    <Box>
      <Typography component="h1" variant="h5" textAlign={"center"}>
        {"Registrieren"}
      </Typography>
      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      <Box
        component='form'
        id='sign-up-form'
        noValidate
        onSubmit={signUpForm.handleSubmit}
        sx={{ mt: 3 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id='email'
              name='email'
              label={'Email'}
              value={signUpForm.values.email}
              onBlur={signUpForm.handleBlur}
              error={
                signUpForm.touched.email && Boolean(signUpForm.errors.email)
              }
              helperText={
                getIn(signUpForm.touched, "email") &&
                getIn(signUpForm.errors, "email")
              }
              onChange={signUpForm.handleChange}
              fullWidth
              autoComplete='email'
              variant='outlined'
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id='username'
              name='username'
              label={'Nutzername'}
              value={signUpForm.values.username}
              onBlur={signUpForm.handleBlur}
              error={
                signUpForm.touched.username &&
                Boolean(signUpForm.errors.username)
              }
              helperText={
                getIn(signUpForm.touched, "username") &&
                getIn(signUpForm.errors, "username")
              }
              onChange={signUpForm.handleChange}
              fullWidth
              autoComplete='username'
              variant='outlined'
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id='password'
              name='password'
              label={'Passwort'}
              value={signUpForm.values.password}
              onBlur={signUpForm.handleBlur}
              error={
                signUpForm.touched.password &&
                Boolean(signUpForm.errors.password)
              }
              helperText={
                getIn(signUpForm.touched, "password") &&
                getIn(signUpForm.errors, "password")
              }
              onChange={signUpForm.handleChange}
              fullWidth
              autoComplete='password'
              variant='outlined'
              type={showPassword.current_password ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      aria-label='toggle current password visibility'
                      onClick={() =>
                        handleClickShowPassword('current_password')
                      }
                      onMouseDown={handleMouseDownPassword}
                      edge='end'
                    >
                      {showPassword.current_password ? (
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
              id='re_password'
              name='re_password'
              label={'Passwort wiederholen'}
              value={signUpForm.values.re_password}
              onBlur={signUpForm.handleBlur}
              error={
                signUpForm.touched.re_password &&
                Boolean(signUpForm.errors.re_password)
              }
              helperText={
                getIn(signUpForm.touched, "re_password") &&
                getIn(signUpForm.errors, "re_password")
              }
              onChange={signUpForm.handleChange}
              fullWidth
              autoComplete='re_password'
              variant='outlined'
              type={showPassword.current_password ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      aria-label='toggle current password visibility'
                      onClick={() =>
                        handleClickShowPassword('current_password')
                      }
                      onMouseDown={handleMouseDownPassword}
                      edge='end'
                    >
                      {showPassword.current_password ? (
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
            <Button
              type='submit'
              fullWidth
              form='sign-up-form'
              variant='contained'
            >
              {'Registrieren'}
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
          <Grid item xs={12} display='flex' justifyContent='center'>
            <Link
              component={RouterLink}
              to={getAuthenticationUrl() + getSignInUrl()}
              variant='body2'
            >
              {'Du hast ein Konto? Melde dich an'}
            </Link>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
