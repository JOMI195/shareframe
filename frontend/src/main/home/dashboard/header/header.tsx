import { FC } from 'react';
import { Card, CardContent, Typography, Box, IconButton } from "@mui/material";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from "react-router";
import { getSettingsUrl, getUserSettingsUrl, getAppSettingsUrl } from "@/assets/endpoints/app/settingEndpoints";
import { useSeasonPick } from "@/common/components/seasonal/useSeasonSlot";

interface HeaderProps {
    username: string;
}

const Header: FC<HeaderProps> = ({ username }) => {
    const navigate = useNavigate();
    const greeting = useSeasonPick('greeting');

    return (
        <Card sx={{ mb: 2, bgcolor: "primary.main", color: "primary.contrastText" }}>
            <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="h5" sx={{
                            fontWeight: "bold"
                        }}>
                            Hi, {username}
                        </Typography>
                        <Typography variant="body2">
                            {greeting ?? "Willkommen zu ShareFrame"}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row" }}>
                        <IconButton
                            aria-label="Account-Einstellungen"
                            sx={{ color: "inherit", width: 44, height: 44 }}
                            onClick={() => navigate("/" + getSettingsUrl() + getUserSettingsUrl())}
                        >
                            <ManageAccountsIcon />
                        </IconButton>
                        <IconButton
                            aria-label="App-Einstellungen"
                            sx={{ color: "inherit", width: 44, height: 44 }}
                            onClick={() => navigate("/" + getSettingsUrl() + getAppSettingsUrl())}
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default Header;