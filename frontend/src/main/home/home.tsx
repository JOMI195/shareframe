import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { Box, useTheme, useMediaQuery } from '@mui/material';


import Logo from '@/common/components/logo';

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;


const Home = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box
            sx={{
                textAlign: "center",
            }}
        >
        </Box>
    );
};

export default Home;