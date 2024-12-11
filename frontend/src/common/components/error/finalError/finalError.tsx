import React from 'react';
import {
    Container,
    Typography,
    Box,
    Link,
} from '@mui/material';

const FinalError: React.FC = ({

}) => {

    return (
        <Container
            maxWidth="sm"
            sx={{
                p: 2,
                mt: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: "white"
            }}
        >
            <img
                src={"/logo-light-full-shareframe.svg"}
                alt="Logo"
                style={{
                    width: '100%',
                    maxWidth: 300,
                    marginRight: 16,
                    marginBottom: 50
                }}
            />

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    backgroundColor: "white"
                }}
            >
                <Typography variant="h5" gutterBottom color="error">
                    Kritischer Systemfehler
                </Typography>
                <Typography variant="body1" color="black">
                    Es trat ein wiederholter Systemfehler auf. Um den Fehler zu beheben lösche bitte alle lokalen Websitedaten und lade die Seite erneut.
                </Typography>
                <Typography variant="body1" color="black" paragraph>
                    Wenn dies nicht möglich ist oder der Fehler weiterhin besteht kontaktiere bitte unseren Support.
                </Typography>
                <Typography>
                    Support-Email:
                    <Link
                        href="mailto:info@der-witz-des-tages.de"
                        color="primary"
                        sx={{ pl: 1 }}
                    >
                        info@der-witz-des-tages.de
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
};

export default FinalError;