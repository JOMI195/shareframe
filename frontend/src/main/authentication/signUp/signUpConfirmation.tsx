import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Link } from '@mui/material';
import { useDispatch } from 'react-redux';
import { resendActivationEmail } from '@/store/entities/authentication/authentication.actions';
import { useLocation } from 'react-router-dom';

interface SignUpConfirmationProps {
    resendActivationTo: string | null;
}

const SignUpConfirmation: React.FC = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { resendActivationTo } = (location.state as SignUpConfirmationProps) || { resendActivationTo: null };

    const [isDisabled, setIsDisabled] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(30);

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const loggedIn = localStorage.getItem('loggedIn') === 'true';
        setIsLoggedIn(loggedIn);

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'loggedIn') {
                setIsLoggedIn(event.newValue === 'true');
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        let timerId: number | null = null;

        if (isDisabled) {
            timerId = window.setInterval(() => {
                setSecondsLeft(prevSeconds => {
                    if (prevSeconds <= 1) {
                        window.clearInterval(timerId!);
                        setIsDisabled(false);
                        return 30;
                    }
                    return prevSeconds - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerId !== null) window.clearInterval(timerId);
        };
    }, [isDisabled]);

    const handleResendClick = () => {
        if (resendActivationTo !== null) {
            dispatch(resendActivationEmail(resendActivationTo));
            setIsDisabled(true);
        }
    };

    if (isLoggedIn) {
        return (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="body1" textAlign={"center"}>
                        Du kannst diese Seite jetzt schließen
                    </Typography>
                </Grid>
            </Grid>
        );
    }

    return (
        <Box>
            <Typography component="h1" variant="h5" textAlign={"center"}>
                Nutzerregistrierung erfolgreich.
            </Typography>
            <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="body1" textAlign={"center"}>
                            Schaue in dein Emailpostfach um deinen Account zu aktivieren!
                        </Typography>
                    </Grid>
                    {resendActivationTo && (
                        <Grid
                            item
                            xs={12}
                            display='flex'
                            justifyContent="center"
                            alignItems="center"
                        >
                            <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                <Typography variant="body2" component="span">
                                    Du hast keine Email erhalten?
                                </Typography>
                                {!isDisabled && (
                                    <Link
                                        variant="body2"
                                        component="button"
                                        onClick={handleResendClick}
                                        sx={{ ml: 1 }}
                                    >
                                        {'Klicke hier um die Aktivierungsmail erneut zu senden'}
                                    </Link>
                                )}
                                {isDisabled && (
                                    <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                        Bitte warte {secondsLeft} Sekunden um die Aktivierungsmail erneut zu senden
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Box>
    );
};

export default SignUpConfirmation;
