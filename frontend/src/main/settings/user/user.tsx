import PersonIcon from "@mui/icons-material/Person";
import KeyIcon from "@mui/icons-material/Key";
import LogoutIcon from '@mui/icons-material/Logout';
import { Button, Stack } from "@mui/material";
import { Link } from "react-router";
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
import NotificationsIcon from '@mui/icons-material/Notifications';
import Notifications from "./notifications/notifications";

const UserSettings = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadMyUserProfile());
  }, [dispatch]);

  const tabs = [
    {
      label: "Profil",
      id: "profile",
      icon: <PersonIcon />,
      content: (
        <Stack spacing={2}>
          <Profile />
          <Email />
        </Stack>
      ),
    },
    {
      label: "Mitteilungen",
      id: "notifications",
      icon: <NotificationsIcon />,
      content: <Notifications />,
    },
    {
      label: "Passwort",
      id: "password",
      icon: <KeyIcon />,
      content: <Security />,
    },
    {
      label: "Löschen",
      id: "delete",
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