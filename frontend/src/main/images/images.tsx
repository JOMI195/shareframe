import React, { useEffect } from "react";
import { Box, Container } from "@mui/material";
import { AddButton } from "./buttons/addButton";
import Dialogs from "./dialogs/dialogs";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchImages } from "@/store/entities/images/images.actions";
import { fetchFriendships } from "@/store/entities/friendships/friendships.actions";
import ImagesGallery from "./gallery/imagesGallery";
import { getImagesPaginated, getImagesPaginatedPageSize } from "@/store/entities/images/images.slice";

const Images: React.FC = () => {
    const dispatch = useAppDispatch();

    const page = useAppSelector(getImagesPaginated).page;
    const pageSize = useAppSelector(getImagesPaginatedPageSize);

    useEffect(() => {
        dispatch(fetchFriendships());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchImages(page, pageSize));
    }, [dispatch, page, pageSize]);

    return (
        <Container maxWidth={"md"} disableGutters>
            <Box
                sx={{
                    height: "100%",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <ImagesGallery />
            </Box>
            <AddButton />
            <Dialogs />
        </Container>
    );
};

export default Images;