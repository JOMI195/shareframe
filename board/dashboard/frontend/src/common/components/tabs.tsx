import * as React from "react";
import { Box, Divider, Tab, Tabs, Typography, BottomNavigation, BottomNavigationAction, Paper, Grid } from "@mui/material";
import { useMediaQuery, useTheme } from "@mui/material";

interface ShareframeTab {
    label: string;
    icon: React.ReactElement;
    content: React.ReactNode;
}

interface TabsProps {
    title: string;
    tabs: ShareframeTab[];
    headerAction?: React.ReactNode; // Optional header action
}

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
    const { children, value, index, ...other } = props;
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            sx={{ width: '100%' }}
            {...other}
        >
            {value === index && (
                <Box sx={{
                    px: isSmallScreen ? 3 : 5,
                    py: isSmallScreen ? 3 : 5,
                }}>
                    {children}
                </Box>
            )}
        </Box>
    );
}

function a11yProps(index: number) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

const ShareframeTabs: React.FC<TabsProps> = ({ title, tabs, headerAction }) => {
    const [value, setValue] = React.useState(0);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: "100%" }}>
            {!isSmallScreen && (
                <Grid container spacing={2} sx={{ mb: 1 }}>
                    <Grid item xs={12} sm={6} sx={{ order: { xs: 2, sm: 1 }, textAlign: { xs: "left", sm: "left" } }}>
                        <Typography variant="h4">{title}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ order: { xs: 1, sm: 2 }, textAlign: { xs: "center", sm: "right" } }}>
                        {headerAction}
                    </Grid>
                </Grid>
            )}
            {!isSmallScreen && (
                <Divider />
            )}
            <Box sx={{ display: 'flex', flexDirection: isSmallScreen ? 'column' : 'row', flexGrow: 1 }}>
                {!isSmallScreen && (
                    <Box sx={{ width: 200, borderRight: 1, borderColor: 'divider' }}>
                        <Tabs
                            orientation="vertical"
                            variant="scrollable"
                            value={value}
                            onChange={handleChange}
                            aria-label="settings tabs"
                            sx={{
                                '& .MuiTab-root': {
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    minHeight: '48px',
                                    padding: '6px 12px',
                                    mx: "10px",
                                },
                                '& .MuiTab-iconWrapper': {
                                    marginRight: '8px',
                                },
                                pl: 2,
                            }}
                        >
                            {tabs.map((tab, index) => (
                                <Tab
                                    key={index}
                                    icon={tab.icon}
                                    iconPosition="start"
                                    label={tab.label}
                                    {...a11yProps(index)}
                                    sx={{ justifyContent: 'flex-start' }}
                                />
                            ))}
                        </Tabs>
                    </Box>
                )}
                <Box sx={{ flexGrow: 1 }}>
                    {tabs.map((tab, index) => (
                        <TabPanel key={index} value={value} index={index}>
                            {tab.content}
                        </TabPanel>
                    ))}
                </Box>
            </Box>
            {isSmallScreen && (
                <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1 }} elevation={3}>
                    <BottomNavigation
                        value={value}
                        onChange={(_event, newValue) => {
                            setValue(newValue);
                        }}
                        showLabels
                    >
                        {tabs.map((tab, index) => (
                            <BottomNavigationAction key={index} label={tab.label} icon={tab.icon} />
                        ))}
                    </BottomNavigation>
                </Paper>
            )}
        </Box>
    );
};

export default ShareframeTabs;