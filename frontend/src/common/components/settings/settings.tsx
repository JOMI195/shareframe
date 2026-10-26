import * as React from "react";
import { Box, Divider, Tab, Tabs, Typography } from "@mui/material";
import { useMediaQuery, useTheme } from "@mui/material";
import { useSearchParams } from "react-router";

interface SettingsTab {
    label: string;
    // Shown as ?tab=<id>, so a tab can be linked to.
    id: string;
    icon: React.ReactElement;
    content: React.ReactNode;
}

interface SettingsProps {
    title: string;
    tabs: SettingsTab[];
    headerAction?: React.ReactNode;
}

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
    const { children, value, index, ...other } = props;

    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            sx={{ width: '100%' }}
            {...other}
        >
            {value === index && (
                <Box sx={{ px: { xs: 0, sm: 5 }, py: { xs: 2, sm: 5 } }}>
                    {children}
                </Box>
            )}
        </Box>
    );
}

const Settings: React.FC<SettingsProps> = ({ title, tabs, headerAction }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const value = Math.max(0, tabs.findIndex((tab) => tab.id === searchParams.get("tab")));
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setSearchParams({ tab: tabs[newValue].id }, { replace: true });
    };

    const tabList = (
        <Tabs
            orientation={isSmallScreen ? "horizontal" : "vertical"}
            variant="scrollable"
            scrollButtons={false}
            value={value}
            onChange={handleChange}
            aria-label="settings tabs"
            sx={isSmallScreen ? {
                "& .MuiTab-root": { minHeight: 48 },
            } : {
                '& .MuiTab-root': {
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    minHeight: '48px',
                    padding: '6px 12px',
                    mx: "10px",
                },
                "& .MuiTab-icon": {
                    marginRight: '8px',
                },
                pl: 2,
            }}
        >
            {tabs.map((tab, index) => (
                <Tab
                    key={tab.id}
                    icon={tab.icon}
                    iconPosition="start"
                    label={tab.label}
                    id={`settings-tab-${index}`}
                    aria-controls={`settings-tabpanel-${index}`}
                />
            ))}
        </Tabs>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: { xs: 1, sm: 2 } }}>
                <Typography variant="h4" component="h1">{title}</Typography>
                {headerAction}
            </Box>
            {isSmallScreen ? (
                <Box
                    sx={{
                        position: "sticky",
                        top: (theme) => theme.layout.appbar.height,
                        zIndex: (theme) => theme.zIndex.appBar - 1,
                        bgcolor: "background.default",
                        borderBottom: 1,
                        borderColor: "divider",
                        mx: -2,
                    }}
                >
                    {tabList}
                </Box>
            ) : (
                <Divider />
            )}
            <Box sx={{ display: 'flex', flexDirection: isSmallScreen ? 'column' : 'row', flexGrow: 1 }}>
                {!isSmallScreen && (
                    <Box sx={{ width: 200, borderRight: 1, borderColor: 'divider' }}>
                        {tabList}
                    </Box>
                )}
                <Box sx={{ flexGrow: 1 }}>
                    {tabs.map((tab, index) => (
                        <TabPanel key={tab.id} value={value} index={index}>
                            {tab.content}
                        </TabPanel>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default Settings;
