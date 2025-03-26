// components/LoginPage.tsx
import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button,
    InputAdornment,
    IconButton
} from '@mui/material';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

interface AuthenticationProps {
    onLogin: (password: string) => Promise<void>;
}

function Authentication({ onLogin }: AuthenticationProps): React.ReactElement {
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        try {
            await onLogin(password);
        } finally {
            setLoading(false);
        }
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
    };

    return (
        <Box
            sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: 400,
                mx: 'auto',
                mt: 8
            }}
        >
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    color: 'background.paper',
                    p: 2,
                    borderRadius: '50%',
                    mb: 2
                }}
            >
                <LockOutlinedIcon fontSize="large" />
            </Box>

            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                {"Anmeldung"}
            </Typography>

            <Typography gutterBottom textAlign={"center"}>
                {"Nutze ein OTP um dich anzumelden. Dieses erhälst du bei deinem Bilderrahmen in der ShareFrame Website Bilderrahmen Übersicht"}
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="OTP"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle current password visibility"
                                    onClick={() => handleClickShowPassword()}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading || !password}
                >
                    {'Anmelden'}
                </Button>
            </Box>
        </Box>
    );
}

export default Authentication;
