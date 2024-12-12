import React from "react";
import { Box, Container } from "@mui/material";
import SentImagesTable from "./tables/sentImagesTable";

const SentImages: React.FC = () => {
    return (
        <Container maxWidth={"md"} disableGutters>
            <Box sx={{
                height: "100%",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column"
            }}>
                <SentImagesTable />
            </Box>
        </Container>
    );
}

export default SentImages;