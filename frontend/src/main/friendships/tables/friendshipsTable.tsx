import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getFriendships } from "@/store/entities/friendships/friendships.slice";
import { Avatar, Box, Stack, Tooltip, IconButton, ListItemAvatar, ListItemText, useMediaQuery, useTheme } from "@mui/material";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { IFriendship } from "@/types";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingSkeletonOverly, NoRowsOverlay } from "./common/overlays";
import { DataGrid, GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import { openDeleteFriendshipsDialog } from "@/store/ui/friendships/friendships.slice";

export interface IFriendshipsTableRowData extends IFriendship {
    table_id: number;
}

interface FriendshipsTableProps {

}

const FriendshipsTable: React.FC<FriendshipsTableProps> = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const friendships = useAppSelector(getFriendships);
    const loading = useAppSelector(getApi).loading;
    const user = useAppSelector(getUser);

    const matches = useMediaQuery(theme.breakpoints.up('md'));

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});

    const deleteFriendButtonClickHandle = (row: IFriendshipsTableRowData) => {
        dispatch(openDeleteFriendshipsDialog({ friendshipId: row.id }))
    }

    const tableColumns: GridColDef[] = [
        {
            field: 'friend',
            headerName: "Nutzername",
            type: 'string',
            minWidth: 150,
            flex: 1,
            align: 'left',
            headerAlign: 'left',
            renderCell: ({ row }) => {
                const friend = row.sender === user.me.username ? row.sender : row.reciever;
                return (
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        height: "100%",
                        width: "100%"
                    }}>
                        <Stack direction="row" spacing={-2} alignItems={"center"}>
                            <ListItemAvatar>
                                <Avatar
                                    sx={{
                                        width: 25,
                                        height: 25,
                                    }}
                                    alt="Account"
                                >
                                    {`${friend.slice(0, 1).toUpperCase()}`}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={`${friend}`}
                            />
                        </Stack>
                    </Box>
                )
            }
        },
        {
            field: 'updated_at',
            headerName: "Befreundet seit",
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
                        <Tooltip title={"Freundschaft löschen"}>
                            <IconButton
                                onClick={() => { deleteFriendButtonClickHandle(row) }}
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

    const tableRows = friendships
        .filter((friendship) => friendship.status === "accepted")
        .map((friendship: IFriendship, index: number): IFriendshipsTableRowData => {

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
                friend: true,
                created_at: false,
                actions: true
            });
        } else {
            setColumnVisibilityModel({
                friend: true,
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
                noRowsOverlay: () => <NoRowsOverlay message="Bisher keine Freunde hinzugefügt" />,
            }}
            loading={loading}
            sx={{ '--DataGrid-overlayHeight': '300px' }}
        />
    );
}

export default FriendshipsTable;