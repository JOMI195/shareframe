import React from "react";
import { Box, Container } from "@mui/material";
import { AddButton } from "./buttons/addButton";
import Dialogs from "./dialogs/dialogs";
import FramesTable from "./tables/framesTable";

const Frames: React.FC = () => {
    return (
        <Container maxWidth={"md"} >
            <Box sx={{
                height: "100%",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column"
            }}>
                <FramesTable />
            </Box>
            <AddButton />
            <Dialogs />
        </Container>
    );
}

export default Frames;