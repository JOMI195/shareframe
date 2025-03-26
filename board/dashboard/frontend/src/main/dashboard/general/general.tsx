import React from 'react';
import {
    Box,
    Typography,
    Stack,
    CardContent,
    Card,
} from '@mui/material';

interface EinkPictureFrameProps {
    deviceId?: string;
    resolution?: string;
    firmwareVersion?: string;
    refreshInterval?: number;
}

const General: React.FC<EinkPictureFrameProps> = ({
    deviceId = "EF-2025-0042",
    resolution = "800 x 480",
    firmwareVersion = "1.0.0",
    refreshInterval = 15
}) => {
    return (
        <Stack spacing={3}>
            <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Gerät
                    </Typography>
                    <Box display={"flex"} justifyContent={"space-between"}>
                        <Typography variant="body2" gutterBottom>
                            Seriennummer:
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            {deviceId}
                        </Typography>
                    </Box>
                    <Box display={"flex"} justifyContent={"space-between"}>
                        <Typography variant="body2" gutterBottom>
                            Version:
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            {firmwareVersion}
                        </Typography>
                    </Box>

                </CardContent>
            </Card>

            <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box width="100%">
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Hardwarespezifikation
                        </Typography>
                        <Box display={"flex"} justifyContent={"space-between"}>
                            <Typography variant="body2" gutterBottom>
                                Display-Größe:
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                {resolution}
                            </Typography>
                        </Box>
                        <Box display={"flex"} justifyContent={"space-between"}>
                            <Typography variant="body2" gutterBottom>
                                Aktualisierungsrate:
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                {refreshInterval} Minuten
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Stack >
    );
};

export default General;