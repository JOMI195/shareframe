import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { Box, Stack, Tooltip, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { IFrame } from "@/types";
import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingSkeletonOverly, NoRowsOverlay } from "./common/overlays";
import { DataGrid, GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import { getApi, getFrames } from "@/store/entities/frames/frames.slice";
import { fetchframes } from "@/store/entities/frames/frames.actions";
import { openUnregisterFrameDialog } from "@/store/ui/frames/frames.slice";
import { formatGermanDateTime } from "@/common/components/dateUtils";

export interface IFramesTableRowData extends IFrame {
    table_id: number;
}

interface FramesTableProps {

}

const FramesTable: React.FC<FramesTableProps> = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const frames = useAppSelector(getFrames);
    const loading = useAppSelector(getApi).loading;

    const matches = useMediaQuery(theme.breakpoints.up('md'));

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});

    const unregisterFrameButtonClickHandle = (row: IFramesTableRowData) => {
        dispatch(openUnregisterFrameDialog({ frameId: row.id }))
    }

    const tableColumns: GridColDef[] = [
        {
            field: 'public_serial_number',
            headerName: "Seriennummer",
            type: 'string',
            minWidth: 280,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
        },
        {
            field: 'registered_at',
            headerName: "Hinzugefügt am",
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
                        <Tooltip title={"Bilderrahmen abmelden"}>
                            <IconButton
                                onClick={() => { unregisterFrameButtonClickHandle(row) }}
                                aria-label="delete"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>
            )
        },
    ];

    const tableRows = frames.map((frame: IFrame, index: number): IFramesTableRowData => {
        return ({
            table_id: index + 1,
            id: frame.id,
            public_serial_number: frame.public_serial_number,
            is_active: frame.is_active,
            registered_at: formatGermanDateTime(new Date(frame.registered_at))
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
        dispatch(fetchframes());
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
                noRowsOverlay: () => <NoRowsOverlay message="Bisher keine Bilderrahmen hinzugefügt" />,
            }}
            loading={loading}
            sx={{ '--DataGrid-overlayHeight': '300px' }}
        />
    );
}

export default FramesTable;