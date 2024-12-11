import PersonIcon from "@mui/icons-material/Person";
import KeyIcon from "@mui/icons-material/Key";
import LogoutIcon from '@mui/icons-material/Logout';
import { Button, Grid } from "@mui/material";
import { Link } from "react-router-dom";
import { getAuthenticationUrl, getSignOutUrl } from "@/assets/endpoints/app/authEndpoints";
import Profile from "./profile/profile";
import Security from "./password/password";
import Email from "./email/email";
import Settings from "@/common/components/settings/settings";
import { useAppDispatch } from "@/store";
import { useEffect } from "react";
import { loadMyUserProfile } from "@/store/entities/authentication/authentication.actions";
import Delete from "./delete/delete";
import DeleteIcon from '@mui/icons-material/Delete';

const UserSettings = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadMyUserProfile());
  }, []);

  const tabs = [
    {
      label: "Profil",
      icon: <PersonIcon />,
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Email />
          </Grid>
          <Grid item xs={12}>
            <Profile />
          </Grid>
        </Grid>
      ),
    },
    {
      label: "Passwort",
      icon: <KeyIcon />,
      content: <Security />,
    },
    {
      label: "Löschen",
      icon: <DeleteIcon />,
      content: <Delete />,
    },
  ];

  const logoutButton = (
    <Button
      component={Link}
      to={getAuthenticationUrl() + getSignOutUrl()}
      variant="outlined"
      startIcon={<LogoutIcon />}
    >
      Abmelden
    </Button>
  );

  return (
    <Settings
      title="Nutzerkonto"
      tabs={tabs}
      headerAction={logoutButton}
    />
  );
};

export default UserSettings;