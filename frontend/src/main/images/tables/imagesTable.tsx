import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { Box, Stack, Tooltip, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { IImage } from "@/types";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingSkeletonOverly, NoRowsOverlay } from "./common/overlays";
import { DataGrid, GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import { openDeleteImageDialog, openPreviewImageDialog, openSendImageToUserFrameDialog } from "@/store/ui/images/images.slice";
import { getApi, getImages } from "@/store/entities/images/images.slice";
import SendIcon from '@mui/icons-material/Send';

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

export interface IImagesTableRowData extends IImage {
    table_id: number;
}

interface ImagesTableProps {

}

const ImagesTable: React.FC<ImagesTableProps> = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const images = useAppSelector(getImages);
    const loading = useAppSelector(getApi).loading;

    const matches = useMediaQuery(theme.breakpoints.up('md'));

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});

    const deleteImageButtonClickHandle = (row: IImagesTableRowData) => {
        dispatch(openDeleteImageDialog({ imageId: row.id }))
    }

    const sendImageButtonClickHandle = (row: IImagesTableRowData) => {
        dispatch(openSendImageToUserFrameDialog({ imageId: row.id }))
    }

    const tableColumns: GridColDef[] = [
        {
            field: 'image',
            headerName: "Bild",
            width: 100,
            sortable: false,
            renderCell: ({ row }) => (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <img
                        src={MEDIA_BASE_URL + row.url}
                        alt={row.name}
                        style={{ maxWidth: "80px", maxHeight: "80px", objectFit: "contain" }}
                        onClick={() => dispatch(openPreviewImageDialog({ url: MEDIA_BASE_URL + row.url }))}
                    />
                </Box>
            ),
        },
        {
            field: 'name',
            headerName: "Name",
            type: 'string',
            minWidth: 160,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: 'created_at',
            headerName: "Hochgeladen am",
            type: 'string',
            minWidth: 160,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: "actions",
            headerName: "Aktionen",
            width: 100,
            align: "center",
            headerAlign: 'center',
            sortable: false,
            renderCell: ({ row }) => (
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%"
                }}>
                    <Stack direction="row">
                        <Tooltip title={"Foto löschen"}>
                            <IconButton
                                onClick={() => { deleteImageButtonClickHandle(row) }}
                                aria-label="delete"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={"Foto senden"}>
                            <IconButton
                                onClick={() => { sendImageButtonClickHandle(row) }}
                                aria-label="delete"
                            >
                                <SendIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>
            )
        },
    ];

    const tableRows = images
        .map((Image: IImage, index: number): IImagesTableRowData => {

            return ({
                table_id: index + 1,
                id: Image.id,
                name: Image.name,
                url: Image.url,
                size: Image.size,
                created_at: formatGermanDateTime(new Date(Image.created_at)),
            })
        });

    useEffect(() => {
        if (!matches) {
            setColumnVisibilityModel({
                image: true,
                name: true,
                created_at: false,
                actions: true
            });
        } else {
            setColumnVisibilityModel({
                image: true,
                name: true,
                created_at: true,
                actions: true
            });
        }
    }, [matches]);

    return (
        <DataGrid
            rows={tableRows}
            columns={tableColumns}
            initialState={{
                pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                },
            }}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            checkboxSelection={false}
            disableRowSelectionOnClick
            disableColumnMenu
            columnVisibilityModel={columnVisibilityModel}
            slots={{
                loadingOverlay: LoadingSkeletonOverly,
                noRowsOverlay: () => <NoRowsOverlay message="Bisher keine Fotos hinzugefügt" />,
            }}
            loading={loading}
            sx={{ '--DataGrid-overlayHeight': '300px' }}
        />
    );
}

export default ImagesTable;