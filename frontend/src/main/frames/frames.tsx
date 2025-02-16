import React, { useEffect } from "react";
import { Box, Container } from "@mui/material";
import { AddButton } from "./buttons/addButton";
import Dialogs from "./dialogs/dialogs";
import FramesGallery from "./gallery/framesGallery";
import { useAppDispatch } from "@/store";
import { fetchframes } from "@/store/entities/frames/frames.actions";

const Frames: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchframes());
    }, []);

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