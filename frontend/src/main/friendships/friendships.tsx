import React, { useEffect } from "react";
import { Badge, Box, Container, Divider, Tab, Tabs } from "@mui/material";
import { AddButton } from "./buttons/addButton";
import Dialogs from "./dialogs/dialogs";
import FriendshipsTable from "./tables/friendshipsTable";
import CustomTabPanel, { a11yProps } from "./tabs/tabs";
import FriendshipRequestTable from "./tables/friendshipRequestsTable";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchFriendships } from "@/store/entities/friendships/friendships.actions";
import { getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";

const Friendships: React.FC = () => {
    const dispatch = useAppDispatch();
    const [selectedTabIndex, setSelectedTabIndex] = React.useState(0);

    const user = useAppSelector(getUser);
    const friendships = useAppSelector(getFriendships);

    const pendingRequests = friendships.filter(friendship => friendship.status === "pending" && friendship.reciever === user.me.username).length;

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setSelectedTabIndex(newValue);
    };

    useEffect(() => {
        setSelectedTabIndex(0);
    }, []);

    useEffect(() => {
        dispatch(fetchFriendships());
    }, []);

    const tabStyle = {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '150px',
        padding: '12px 24px'
    };

    return (
        <Container maxWidth={"md"} disableGutters>
            <Box sx={{
                height: "100%",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column"
            }}>
                <Tabs
                    value={selectedTabIndex}
                    onChange={handleChange}
                    aria-label="ifcmodelcreation request tabs"
                    orientation="horizontal"
                    sx={{ borderColor: 'divider', minWidth: 200 }}
                >
                    <Tab sx={tabStyle} label="Freunde" {...a11yProps(0)} />
                    <Tab
                        sx={tabStyle}
                        label={
                            <Badge
                                badgeContent={pendingRequests}
                                color="primary"
                                sx={{
                                    '& .MuiBadge-badge': {
                                        right: -15,
                                        top: 1
                                    }
                                }}
                            >
                                Anfragen
                            </Badge>
                        }
                        {...a11yProps(1)}
                    />
                </Tabs>
                <Divider sx={{ mb: 5 }} />
                <CustomTabPanel value={selectedTabIndex} index={0}>
                    <FriendshipsTable />
                </CustomTabPanel>
                <CustomTabPanel value={selectedTabIndex} index={1}>
                    <FriendshipRequestTable />
                </CustomTabPanel>
            </Box>
            <AddButton />
            <Dialogs />
        </Container>
    );
}

export default Friendships;