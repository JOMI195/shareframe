import { useDispatch } from "react-redux";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { getDashboardUrl } from "@/assets/endpoints/app/appEndpoints";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import {
  signOutUser,
} from "@/store/entities/authentication/authentication.actions";
import { getAuthenticationUrl, getSignInUrl } from "@/assets/endpoints/app/authEndpoints";
import { unsubscribePush } from "@/common/utils/pwa/push";
import { clearSharedFiles } from "@/common/utils/pwa/sharedFiles";
import { clearAvatarCache } from "@/common/utils/avatar/avatarCache";
import { clearImageCache } from "@/common/utils/imageCache";
import { pushPromptReset } from "@/store/ui/settings/settings.slice";

export default function SignOut() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setBusy(true);
    // Before the logout, while the DELETE is still authenticated.
    await unsubscribePush().catch(() => undefined);
    dispatch(pushPromptReset());
    await clearSharedFiles().catch(() => undefined);
    // Awaited, else the route change cancels the request.
    await dispatch(signOutUser());
    clearAvatarCache();
    clearImageCache();
    navigate(getAuthenticationUrl() + getSignInUrl(), { replace: true });
  };

  // Opened directly there is no page of ours to go back to.
  const handleCancel = () => {
    if (location.key === "default") navigate(getDashboardUrl(), { replace: true });
    else navigate(-1);
  };

  return (
    <Box>
      <Typography component="h1" variant="h5" sx={{
        textAlign: "center"
      }}>
        {"Abmelden"}
      </Typography>
      <Box
        component="form"
        id="sign-out-form"
        noValidate
        sx={{ mt: 3 }}
      >
        <Grid container spacing={2}>
          <Grid size={12}>
            <Typography variant="body1" sx={{
              textAlign: "center"
            }}>
              {"Bist du dir wirklich sicher, dass du dich abmelden willst?"}
            </Typography>
          </Grid>
          <Grid size={12}>
            <Button
              type="button"
              form="sign-out-form"
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSignOut}
              loading={busy}
            >
              {"Abmelden"}
            </Button>
          </Grid>
          <Grid size={12}>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              disabled={busy}
            >
              {"Abbrechen"}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
