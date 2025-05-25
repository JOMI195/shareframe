import React, { useEffect } from "react";
import { Box, Container } from "@mui/material";
import { Actions } from "./actions/actions";
import Dialogs from "./dialogs/dialogs";
import FramesGallery from "./gallery/framesGallery";
import { useAppDispatch } from "@/store";
import { fetchframes } from "@/store/entities/frames/frames.actions";

const Frames: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchframes());
    }, []);

    useEffect(() => {
        const getFrames = () => {
            dispatch(fetchframes());
        };

        window.addEventListener('focus', getFrames);

        return () => {
            window.removeEventListener('focus', getFrames);
        };
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
            <Actions />
            <Dialogs />
        </Container>
    );
}

export default Frames;