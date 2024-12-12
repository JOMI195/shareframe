import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { acceptFrindshipRequest, fetchFriendships, rejectFrindshipRequest } from "@/store/entities/friendships/friendships.actions";
import { getFriendships } from "@/store/entities/friendships/friendships.slice";
import { Box, Stack, Tooltip, IconButton, useMediaQuery, useTheme, Chip } from "@mui/material";
import { getApi, getUser } from "@/store/entities/authentication/authentication.slice";
import { IFriendship } from "@/types";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingSkeletonOverly, NoRowsOverlay } from "./common/overlays";
import { DataGrid, GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import HowToRegIcon from '@mui/icons-material/HowToReg';

export interface IFriendshipRequestTableRowData extends IFriendship {
    table_id: number;
}

interface FriendshipRequestTableProps {

}

const FriendshipRequestTable: React.FC<FriendshipRequestTableProps> = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const friendships = useAppSelector(getFriendships);
    const loading = useAppSelector(getApi).loading;
    const user = useAppSelector(getUser);

    const matches = useMediaQuery(theme.breakpoints.up('md'));

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});

    const handleFriendshipReject = async (row: IFriendshipRequestTableRowData) => {
        await dispatch(rejectFrindshipRequest(row.id));
        dispatch(fetchFriendships());
    }

    const handleFriendshipAcccept = async (row: IFriendshipRequestTableRowData) => {
        await dispatch(acceptFrindshipRequest(row.id));
        dispatch(fetchFriendships());
    }

    const tableColumns: GridColDef[] = [
        {
            field: 'sender',
            headerName: "Von",
            type: 'string',
            minWidth: 100,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
            renderCell: ({ row }) => {
                const isMyRequest = row.sender === user.me.username;
                return isMyRequest ? "Dir" : row.sender
            }
        },
        {
            field: 'reciever',
            headerName: "An",
            type: 'string',
            minWidth: 100,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
            renderCell: ({ row }) => {
                const isMyRequest = row.reciever === user.me.username;
                return isMyRequest ? "Dich" : row.reciever
            }
        },
        {
            field: 'status',
            headerName: "Status",
            type: 'string',
            minWidth: 150,
            align: 'left',
            headerAlign: 'left',
            renderCell: ({ row }) => {
                const statusGerman = row.status === "accepted" ? "Akzeptiert" : row.status === "pending" ? "Ausstehend" : "Abgelehnt";
                return (
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        height: "100%",
                        width: "100%",
                        gap: 2
                    }}>
                        <Chip
                            size="small"
                            label={statusGerman}
                            color={
                                row.status === "accepted" ? "success" :
                                    row.status === "rejected" ? "error" : "info"}
                        />
                    </Box>
                )
            }
        },
        {
            field: 'updated_at',
            headerName: "Letzte Änderung",
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
            renderCell: ({ row }) => {
                const isMyRequest = row.sender === user.me.username;

                return (
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        width: "100%"
                    }}>
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >
                            {!isMyRequest && row.status !== "rejected" && (
                                <Tooltip title="Freundschaftsanfrage ablehnen">
                                    <IconButton
                                        onClick={() => handleFriendshipReject(row)}
                                        color="error"
                                        aria-label="Anfrage ablehnen"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {!isMyRequest && row.status !== "rejected" && (
                                <Tooltip title="Freundschaftsanfrage annehmen">
                                    <IconButton
                                        onClick={() => handleFriendshipAcccept(row)}
                                        color="success"
                                        aria-label="Anfrage annehmen"
                                    >
                                        <HowToRegIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </Box>
                );
            }
        },
    ];

    const tableRows = friendships
        .filter((friendship) => friendship.status === "pending" || friendship.status === "rejected")
        .map((friendship: IFriendship, index: number): IFriendshipRequestTableRowData => {
            return ({
                table_id: index + 1,
                id: friendship.id,
                sender: friendship.sender,
                reciever: friendship.reciever,
                created_at: formatGermanDateTime(new Date(friendship.created_at)),
                status: friendship.status,
                updated_at: formatGermanDateTime(new Date(friendship.updated_at)),
            })
        });

    useEffect(() => {
        if (!matches) {
            setColumnVisibilityModel({
                request: true,
                status: true,
                actions: true
            });
        } else {
            setColumnVisibilityModel({
                request: true,
                status: true,
                actions: true
            });
        }
    }, [matches]);

    useEffect(() => {
        dispatch(fetchFriendships());
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
                noRowsOverlay: () => <NoRowsOverlay message="Bisher keine Anfragen gestellt oder erhalten" />,
            }}
            loading={loading}
            sx={{ '--DataGrid-overlayHeight': '300px' }}
        />
    );
}

export default FriendshipRequestTable;