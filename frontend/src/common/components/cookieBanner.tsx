import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { allCookiesAccepted, allCookiesDeclined, getCookies } from '@/store/ui/settings/settings.slice';
import Logo from './logo';
import { useNavigate } from 'react-router-dom';
import { getAppSettingsUrl, getSettingsUrl } from '@/assets/endpoints/app/settingEndpoints';
import { isCookieConsentExpired } from '../utils/cookies';

const CookieBanner: React.FC = () => {
    const [open, setOpen] = useState(false);
    const cookies = useAppSelector(getCookies);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const isExpired = isCookieConsentExpired(cookies.consentExpiry)
        if (isExpired) {
            setOpen(true)
        }
    }, [cookies, dispatch]);

    const handleAcceptAll = () => {
        dispatch(allCookiesAccepted());
        setOpen(false);
    };

    const handleDecline = () => {
        dispatch(allCookiesDeclined());
        setOpen(false);
    };

    const handleSettings = () => {
        handleDecline();
        navigate(getSettingsUrl() + getAppSettingsUrl(), { replace: true });
    };

    return (
        <Dialog
            open={open}
            //onClose={handleDecline}
            maxWidth={"md"}
            fullWidth
        >
            <Box
                sx={{
                    m: 3,
                }}
            >
                <Box
                    sx={{
                        textAlign: "center"
                    }}
                >
                    <Logo
                        darkLogoSrc="/logo-dark-full-shareframe.svg"
                        lightLogoSrc="/logo-light-full-shareframe.svg"
                        maxWidth={300}
                        marginRight={0}
                        clickable={false}
                    />
                </Box>
                <DialogTitle>Nutzung von Cookies: Wir benötigen deine Einwilligung</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>Wir verwenden auf dieser Webseite analytische Cookies sowie Cookies von Drittanbietern.</Typography>
                    <Typography gutterBottom>Indem du auf „Cookie-Einstellungen“ klickst, erhälst du in den App-Einstellungen unter dem Reiter "Privatspähre" genauere Informationen zu unseren Cookies und kannst diese nach den eigenen Bedürfnissen anpassen.</Typography>
                    <Typography gutterBottom>Durch einen Klick auf das Auswahlfeld „Alle akzeptieren“ stimmst du der Verwendung aller Cookies zu, die nach „Cookie-Einstellungen“ in den App-Einstellungen unter dem Reiter "Privatspähre" beschrieben werden.</Typography>
                    <Typography>Du kannst deine Einwilligung zur Nutzung von Cookies zu jeder Zeit in den App-Einstellungen unter dem Reiter "Privatspähre" ändern oder widerrufen.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSettings} color="primary">Cookie-Einstellungen</Button>
                    <Button onClick={handleDecline} color="secondary">Nur notwendige Cookies</Button>
                    <Button onClick={handleAcceptAll} color="primary" variant="contained">Alle akzeptieren</Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default CookieBanner;

// import React, { useEffect, useState } from 'react';
// import {
//     Box,
//     Button,
//     Typography,
//     Paper,
//     Slide,
//     Dialog,
//     DialogActions,
//     DialogContent,
//     DialogContentText,
//     DialogTitle,
// } from '@mui/material';
// import { useAppDispatch, useAppSelector } from '@/store';
// import { acceptCookies, checkConsentExpiration, declineCookies, getCookies } from '@/store/ui/settings/settings.slice';
// import Logo from './logo';

// const COOKIE_CONSENT_LIFETIME = Number(import.meta.env.VITE_APP_COOKIE_CONSENT_LIFETIME) || 30;

// interface CookieBannerProps {
//     displayType?: 'banner' | 'modal';
// }

// const CookieBanner: React.FC<CookieBannerProps> = ({ displayType = 'banner' }) => {
//     const [open, setOpen] = useState(false);
//     const cookies = useAppSelector(getCookies);

//     //const cookiesAccepted = cookies.cookiesAccepted;
//     const consentExpiry = cookies.consentExpiry;
//     const dispatch = useAppDispatch();

//     useEffect(() => {
//         dispatch(checkConsentExpiration());
//         if (consentExpiry === null) {
//             setOpen(true);
//         }
//     }, [cookies, dispatch]);

//     const handleAccept = () => {
//         const expiryDate = Date.now() + COOKIE_CONSENT_LIFETIME * 24 * 60 * 60 * 1000;
//         dispatch(acceptCookies(expiryDate));
//         setOpen(false);
//     };

//     const handleDecline = () => {
//         dispatch(declineCookies());
//         setOpen(false);
//     };

//     const handleSettings = () => {
//         alert('Redirect to cookie settings');
//     };

//     if (displayType === 'modal') {
//         return (
//             <Dialog
//                 open={open}
//                 //onClose={handleDecline}
//                 maxWidth={"md"}
//                 fullWidth
//             >
//                 <Box
//                     sx={{
//                         m: 3,
//                     }}
//                 >
//                     <Box
//                         sx={{
//                             textAlign: "center"
//                         }}
//                     >
//                         <Logo
//                             darkLogoSrc="/logo-dark-full-shareframe.svg"
//                             lightLogoSrc="/logo-light-full-shareframe.svg"
//                             maxWidth={300}
//                             marginRight={0}
//                             clickable={false}
//                         />
//                     </Box>
//                     <DialogTitle>Nutzung von Cookies: Wir benötigen Ihre Einwilligung</DialogTitle>
//                     <DialogContent>
//                         <DialogContentText>
//                             Wir verwenden auf dieser Webseite analytische Cookies sowie Cookies von Drittanbietern.
//                             <br />
//                             Indem Sie auf „Cookie-Einstellungen“ klicken, erhalten Sie genauere Informationen zu unseren Cookies und können diese nach Ihren eigenen Bedürfnissen anpassen.
//                             <br />
//                             Durch einen Klick auf das Auswahlfeld „Alle akzeptieren“ stimmen Sie der Verwendung aller Cookies zu, die unter „Cookie-Einstellungen“ beschrieben werden.
//                             <br />
//                             Sie können Ihre Einwilligung zur Nutzung von Cookies zu jeder Zeit ändern oder widerrufen.
//                         </DialogContentText>
//                     </DialogContent>
//                     <DialogActions>
//                         <Button onClick={handleSettings} color="primary">Cookie-Einstellungen</Button>
//                         <Button onClick={handleDecline} color="secondary">Nur notwendige Cookies</Button>
//                         <Button onClick={handleAccept} color="primary" variant="contained">Alle akzeptieren</Button>
//                     </DialogActions>
//                 </Box>
//             </Dialog>
//         );
//     }

//     return (
//         <Slide direction="up" in={open} mountOnEnter unmountOnExit>
//             <Paper elevation={3} sx={{ position: 'fixed', bottom: 0, width: '100%', padding: 2 }}>
//                 <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
//                     <Typography variant="body1">
//                         Nutzung von Cookies: Wir benötigen Ihre Einwilligung
//                         <br />
//                         Wir verwenden auf dieser Webseite analytische Cookies sowie Cookies von Drittanbietern.
//                         <br />
//                         Indem Sie auf „Cookie-Einstellungen“ klicken, erhalten Sie genauere Informationen zu unseren Cookies und können diese nach Ihren eigenen Bedürfnissen anpassen.
//                         <br />
//                         Durch einen Klick auf das Auswahlfeld „Alle akzeptieren“ stimmen Sie der Verwendung aller Cookies zu, die unter „Cookie-Einstellungen“ beschrieben werden.
//                         <br />
//                         Sie können Ihre Einwilligung zur Nutzung von Cookies zu jeder Zeit ändern oder widerrufen.
//                     </Typography>
//                     <Box display="flex" mt={2} flexWrap="wrap">
//                         <Button variant="outlined" color="primary" onClick={handleSettings} sx={{ marginRight: 1 }}>
//                             Cookie-Einstellungen
//                         </Button>
//                         <Button variant="outlined" color="secondary" onClick={handleDecline} sx={{ marginRight: 1 }}>
//                             Nur notwendige Cookies
//                         </Button>
//                         <Button variant="contained" color="primary" onClick={handleAccept}>
//                             Alle akzeptieren
//                         </Button>
//                     </Box>
//                 </Box>
//             </Paper>
//         </Slide>
//     );
// };

// export default CookieBanner;

