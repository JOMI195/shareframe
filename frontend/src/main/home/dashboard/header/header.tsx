import { FC } from 'react';
import { Card, CardContent, Typography, Box, IconButton, useTheme } from "@mui/material";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from "react-router";
import { getSettingsUrl, getUserSettingsUrl, getAppSettingsUrl } from "@/assets/endpoints/app/settingEndpoints";

interface HeaderProps {
    username: string;
}

const Header: FC<HeaderProps> = ({ username }) => {
    const theme = useTheme();
    const navigate = useNavigate();

    return (
        <Card sx={{ mb: 2, bgcolor: theme.palette.primary.main, color: "white" }}>
            <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="h5" fontWeight="bold">
                            Hi, {username}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Willkommen zu ShareFrame
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row" }}>
                        <IconButton
                            size="small"
                            sx={{ color: "white" }}
                            onClick={() => navigate(getSettingsUrl() + getUserSettingsUrl())}
                        >
                            <ManageAccountsIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            sx={{ color: "white" }}
                            onClick={() => navigate(getSettingsUrl() + getAppSettingsUrl())}
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