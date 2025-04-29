import React, { useEffect } from "react";
import { Box, Container } from "@mui/material";
import { useAppDispatch } from "@/store";
import Dashboard from "./dashboard/dashboard";
import { fetchImages, fetchSentImages } from "@/store/entities/images/images.actions";
import { fetchframes } from "@/store/entities/frames/frames.actions";

const Home: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchImages());
        dispatch(fetchSentImages());
        dispatch(fetchframes());
    }, [dispatch]);

    return (
        <Container maxWidth={"sm"} disableGutters>
            <Box
                sx={{
                    height: "100%",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Dashboard />
            </Box>
        </Container>
    );
};

export default Home;