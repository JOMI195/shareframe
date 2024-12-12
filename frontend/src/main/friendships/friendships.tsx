import React, { useEffect } from "react";
import { Box, Container, Divider, Tab, Tabs } from "@mui/material";
import { AddButton } from "./buttons/addButton";
import Dialogs from "./dialogs/dialogs";
import FriendshipsTable from "./tables/friendshipsTable";
import CustomTabPanel, { a11yProps } from "./tabs/tabs";
import FriendshipRequestTable from "./tables/friendshipRequestsTable";
import { useAppDispatch } from "@/store";
import { fetchFriendships } from "@/store/entities/friendships/friendships.actions";

const Friendships: React.FC = () => {
    const dispatch = useAppDispatch();
    const [selectedTabIndex, setSelectedTabIndex] = React.useState(0);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setSelectedTabIndex(newValue);
    };

    useEffect(() => {
        setSelectedTabIndex(0);
    }, []);

    useEffect(() => {
        dispatch(fetchFriendships());
    }, []);

    return (
        <Container maxWidth={"md"} >
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
                    sx={{ borderRight: 1, borderColor: 'divider', minWidth: 150 }}
                >
                    <Tab sx={{ alignItems: 'flex-start', justifyContent: 'flex-start' }} label="Freunde" {...a11yProps(0)} />
                    <Tab sx={{ alignItems: 'flex-start', justifyContent: 'flex-start' }} label="Anfragen" {...a11yProps(1)} />
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