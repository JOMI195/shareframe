import { useEffect } from "react";
import CustomTable from "./customTable/customTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchFriendships } from "@/store/entities/friendships/friendships.actions";
import { getFriendships } from "@/store/entities/friendships/friendships.slice";
import { Box, Button, Container } from "@mui/material";
import { AddButton } from "./buttons/addButton";
import Dialogs from "../dialogs/dialogs";


const Friendships: React.FC = () => {
    const dispatch = useAppDispatch();

    const friendships = useAppSelector(getFriendships);

    const handleDelete = (user: any) => {
        console.log('Delete user', user);
    };

    useEffect(() => {
        dispatch(fetchFriendships());
    }, []);

    return (
        <Container maxWidth={"md"} >
            <CustomTable
                columns={[
                    {
                        key: 'reciever',
                        label: 'Nutzername',
                        minWidth: '100px',
                    },
                    {
                        key: 'created_at',
                        label: 'Hinzugefügt am',
                        flex: 1,
                        minWidth: '300px',
                        type: 'date',
                        hideOn: "sm"
                    }
                ]}
                data={friendships}
                actionWidth="150px"
                actionColumn={(item) => (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end"
                        }}
                    >
                        <Button color="error" onClick={() => handleDelete(item)}>Delete</Button>
                    </Box>
                )}
            />
            <AddButton />
            <Dialogs />
        </Container>
    );
}

export default Friendships;