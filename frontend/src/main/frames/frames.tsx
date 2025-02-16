import React from "react";
import { Box, Container } from "@mui/material";
import { AddButton } from "./buttons/addButton";
import Dialogs from "./dialogs/dialogs";
import FramesGallery from "./gallery/framesGallery";

const Frames: React.FC = () => {
    return (
        <Container maxWidth={"md"} disableGutters>
            <Box sx={{
                height: "100%",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column"
            }}>
                <FramesGallery />
            </Box>
            <AddButton />
            <Dialogs />
        </Container>
    );
}

export default Frames;