import React, { useEffect } from "react";
import { Box, Container } from "@mui/material";
import { AddButton } from "./buttons/addButton";
import Dialogs from "./dialogs/dialogs";
import ImagesTable from "./tables/imagesTable";
import { useAppDispatch } from "@/store";
import { fetchImages } from "@/store/entities/images/images.actions";
import { fetchFriendships } from "@/store/entities/friendships/friendships.actions";

const Images: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchImages());
        dispatch(fetchFriendships());
    }, []);

    return (
        <Container maxWidth={"md"} disableGutters>
            <Box sx={{
                height: "100%",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column"
            }}>
                <ImagesTable />
            </Box>
            <AddButton />
            <Dialogs />
        </Container>
    );
}

export default Images;