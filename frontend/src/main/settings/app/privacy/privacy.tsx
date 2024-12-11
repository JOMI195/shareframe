import React, { useEffect } from 'react';
import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import { useAppSelector } from '@/store';
import { getCookies } from '@/store/ui/settings/settings.slice';

const PrivacySettings: React.FC = () => {
    //const dispatch = useAppDispatch();
    const cookies = useAppSelector(getCookies);

    const [_analyticsCookies, setAnalyticsCookies] = React.useState(cookies.analyticsCookies);

    useEffect(() => {
        setAnalyticsCookies(cookies.analyticsCookies);
    }, [cookies]);

    // const handleAnalyticsCookiesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const isChecked = event.target.checked;
    //     setAnalyticsCookies(isChecked);

    //     if (isChecked) {
    //         dispatch(analyticsCookiesAccepted());
    //     } else {
    //         dispatch(analyticsCookiesDeclined());
    //     }
    // };

    return (
        <Box
        // border={1} 
        // sx={{ 
        //     padding: 2, 
        //     borderRadius: 1, 
        //     borderColor: 'grey.300' 
        // }}
        >
            <Typography variant="h6" gutterBottom>
                Cookies
            </Typography>
            <Typography variant="body1" paragraph>
                Du kannst mehr über die auf der-witz-des-tages.de verwendeten Cookies in den Datenschutzbestimmungen erfahren.
            </Typography>
            <Typography variant="body1" paragraph>
                Um weitere Informationen zu erhalten, kontaktiere uns einfach.
            </Typography>
            <FormControlLabel
                control={
                    <Switch
                        checked={true}
                        color="primary"
                    />
                }
                label="Notwendige Cookies"
                labelPlacement="end"
            />
            <Typography variant="body2" paragraph>
                Notwendige Cookies werden nur von uns geschrieben und gelesen. Diese Cookies garantieren ein reibungsloses Funktionieren der Website und sind für dieses unabdingbar. Daher können notwendige Cookies nicht deaktiviert werden.
            </Typography>
            {/* <FormControlLabel
                control={
                    <Switch
                        checked={analyticsCookies}
                        onChange={handleAnalyticsCookiesChange}
                        color="primary"
                    />
                }
                label="Analytics-Cookies"
                labelPlacement="end"
            />
            <Typography variant="body2" paragraph>
                Analytics-Cookies helfen uns, die Besuchszahlen zu messen.
            </Typography> */}
        </Box>
    );
};

export default PrivacySettings;
