import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { useMediaQuery, useTheme } from "@mui/material";
import { ISentImage } from "@/types";
import { LoadingSkeletonOverly, NoRowsOverlay } from "./common/overlays";
import { DataGrid, GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import { getApi, getSentImages } from "@/store/entities/images/images.slice";
import { fetchSentImages } from "@/store/entities/images/images.actions";

export interface ISentImagesTableRowData extends ISentImage {
    table_id: number;
}

interface SentImagesTableProps {

}

const SentImagesTable: React.FC<SentImagesTableProps> = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const sentImages = useAppSelector(getSentImages);
    const loading = useAppSelector(getApi).loading;

    const matches = useMediaQuery(theme.breakpoints.up('md'));

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});

    const tableColumns: GridColDef[] = [
        {
            field: 'image',
            headerName: "Bild",
            type: 'string',
            minWidth: 250,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
            valueGetter: (_value, row) =>
                `${row.image.name}`,
        },
        {
            field: 'reciever',
            headerName: "Empfänger",
            type: 'string',
            minWidth: 100,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: 'sent_at',
            headerName: "Gesendet am",
            type: 'string',
            minWidth: 160,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: 'expires_at',
            headerName: "Läuft ab am",
            type: 'string',
            minWidth: 160,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
        },
    ];

    const tableRows = sentImages.map((sentImage: ISentImage, index: number): ISentImagesTableRowData => {
        return ({
            table_id: index + 1,
            id: sentImage.id,
            sender: sentImage.sender,
            reciever: sentImage.reciever,
            image: sentImage.image,
            sent_at: formatGermanDateTime(new Date(sentImage.sent_at)),
            expires_at: formatGermanDateTime(new Date(sentImage.expires_at))
        })
    });

    useEffect(() => {
        if (!matches) {
            setColumnVisibilityModel({
                public_serial_number: true,
                is_active: true,
                registered_at: true
            });
        } else {
            setColumnVisibilityModel({
                public_serial_number: true,
                is_active: true,
                registered_at: true
            });
        }
    }, [matches]);

    useEffect(() => {
        dispatch(fetchSentImages());
    }, []);

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
                noRowsOverlay: () => <NoRowsOverlay message="Bisher keine Bilder gesendet" />,
            }}
            loading={loading}
            sx={{ '--DataGrid-overlayHeight': '300px' }}
        />
    );
}

export default SentImagesTable;