import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  authenticateUser,
  loadMyUserProfile,
} from "@/store/entities/authentication/authentication.actions";
import { getApi, signedOut } from "@/store/entities/authentication/authentication.slice";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import { useLocation, useNavigate } from "react-router";
import { safeReturnPath } from "@/common/utils/safeReturnPath";
import { SESSION_EXPIRED_KEY } from "@/services/httpService";
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
import { getDashboardUrl } from "@/assets/endpoints/app/appEndpoints";
import { getIn, useFormik } from "formik";
import { Alert } from "@mui/material";
import { areCookiesEnabled } from "@/common/utils/cookies";

const COOKIES_BLOCKED_MESSAGE = "Dein Browser blockiert Cookies für ShareFrame. Für die Anmeldung werden ausschließlich technisch erforderliche Cookies verwendet, ohne sie ist kein Login möglich. Bitte erlaube Cookies für ShareFrame in den Browser-Einstellungen.";

export default function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Set by the forced logout: tells the user why, and where they were. Kept until the
  // sign-in succeeds, since the page can mount more than once on the way here.
  const [expiredAt] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION_EXPIRED_KEY);
    } catch {
      return null;
    }
  });
  const forgetExpiry = () => {
    try {
      sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    } catch {
      // Nothing was stored.
    }
  };
  const returnTo =
    safeReturnPath((location.state as { from?: string } | null)?.from ?? expiredAt) ?? getDashboardUrl();

  const api = useAppSelector(getApi);

  const [errorMessage, setErrorMessage] = useState("");
  const [cookiesBlocked, setCookiesBlocked] = useState(() => !areCookiesEnabled());

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

  // Only for an already-signed-in visitor; the post-login redirect happens in onSubmit.
  // The protected route loads the profile, so it is not requested here as well.
  useEffect(() => {
    if (localStorage.getItem("loggedIn") === "true" && areCookiesEnabled()) {
      navigate(returnTo, { replace: true });
    }
  }, [navigate, returnTo]);

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
    onSubmit: async (values) => {
      await dispatch(authenticateUser(values));
      if (localStorage.getItem("loggedIn") !== "true") {
        setErrorMessage("Bitte überprüfe deine E-Mail-Adresse und dein Passwort auf Tippfehler (Groß-/ Kleinschreibung beachten). Falls dein Konto noch nicht aktiviert wurde, prüfe bitte deine E-Mails auf die Aktivierungsmail. Versuche es anschließend erneut. Bei wiederholten Problemen kontaktiere bitte unseren Support.");
        signInForm.resetForm();
        return;
      }
      signInForm.resetForm();
      // The server accepted the login, but without cookies the session is lost.
      if (!areCookiesEnabled()) {
        dispatch(signedOut());
        setCookiesBlocked(true);
        return;
      }
      // Awaited, so the protected route finds the profile and does not request it again.
      await dispatch(loadMyUserProfile());
      forgetExpiry();
      navigate(returnTo, { replace: true });
    },
  });

  return (
    <Box>
      <Typography component="h1" variant="h5" sx={{
        textAlign: "center"
      }}>
        {"Anmelden"}
      </Typography>
      {expiredAt !== null && (
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.
        </Alert>
      )}
      {cookiesBlocked && (
        <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
          {COOKIES_BLOCKED_MESSAGE}
        </Alert>
      )}
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
          <Grid size={12}>
            <TextField
              id="email"
              name="email"
              type="email"
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
              slotProps={{
                input: {
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
                }
              }}
            />
          </Grid>
          <Grid size={12}>
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
              autoComplete="current-password"
              variant="outlined"
              type={showPassword ? "text" : "password"}
              slotProps={{
                input: {
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
                }
              }}
            />
          </Grid>
          <Grid size={12}>
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
          <Grid
            size={12}
            sx={{
              display: "flex",
              justifyContent: "center"
            }}>
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
