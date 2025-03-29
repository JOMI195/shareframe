import { useEffect } from 'react';
import {
    Box,
    Typography,
    Stack,
    CardContent,
    Card,
    Divider,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchFrameInfos, selectFrameInfoState } from '@/store/frameInfo/frameInfo.Slice';

const RESOLUTION = "800 x 480";

const General = () => {
    const dispatch = useAppDispatch();
    const frameInfos = useAppSelector(selectFrameInfoState).frameInfo;

    useEffect(() => {
        dispatch(fetchFrameInfos());
    }, []);

    return (
        <Stack spacing={3}>
            <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Gerät
                    </Typography>
                    <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                        <Typography variant="body2" color='primary'>
                            Seriennummer
                        </Typography>
                        <Divider />
                        <Typography variant="body2" gutterBottom>
                            {frameInfos?.public_serial_number ?? ""}
                        </Typography>
                    </Box>
                    <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                        <Typography variant="body2" color='primary'>
                            Version
                        </Typography>
                        <Divider />
                        <Typography variant="body2" gutterBottom>
                            {frameInfos?.version ?? ""}
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
                        <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                            <Typography variant="body2" color='primary'>
                                Display-Größe
                            </Typography>
                            <Divider />
                            <Typography variant="body2" gutterBottom>
                                {RESOLUTION}
                            </Typography>
                        </Box>
                        <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                            <Typography variant="body2" color='primary'>
                                Aktualisierungsrate (Minuten)
                            </Typography>
                            <Divider />
                            <Typography variant="body2" gutterBottom>
                                {frameInfos?.display_refresh_interval_mins ?? ""}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Stack >
    );
};

export default General;