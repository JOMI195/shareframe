import React, { useEffect } from "react";
import { Box, Container } from "@mui/material";
import { useAppDispatch } from "@/store";
import Dashboard from "./dashboard/dashboard";
import { fetchDashboardStats } from "@/store/entities/dashboard/dashboard.actions";

const Home: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchDashboardStats());
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