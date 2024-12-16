import React, { useEffect } from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Box,
    ClickAwayListener,
    useTheme,
    Avatar,
    useMediaQuery,
    Typography,
    Link
} from '@mui/material';
import {
    Settings as SettingsIcon,
} from '@mui/icons-material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeSidebar, getSidebar, openSidedbar } from '@/store/ui/navigation/navigation.slice';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { getUser } from '@/store/entities/authentication/authentication.slice';
import { getAppSettingsUrl, getSettingsUrl, getUserSettingsUrl } from '@/assets/endpoints/app/settingEndpoints';
import { sidebarMenuItems } from '@/assets/sidebarMenu/sideBarMenu';
import { getAuthenticationUrl, getSignOutUrl } from '@/assets/endpoints/app/authEndpoints';
import { getHomeUrl } from '@/assets/endpoints/app/appEndpoints';
import { getImprintUrl, getPrivacyPolicyUrl } from '@/assets/endpoints/app/legalEndpoints';


interface SidebarProps {
}

const Sidebar: React.FC<SidebarProps> = () => {
    const dispatch = useAppDispatch();
    const open = useAppSelector(getSidebar).open;
    const theme = useTheme();
    const location = useLocation();
    const user = useAppSelector(getUser);

    const matches = useMediaQuery(theme.breakpoints.up('xl'));
    const width = 240;
    const openSidebarEdgeDetectionWidth = 50;

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (matches) {
                if (!open && event.clientX <= openSidebarEdgeDetectionWidth) {
                    dispatch(openSidedbar());
                }
                else if (open && event.clientX >= width) {
                    dispatch(closeSidebar());
                }
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [dispatch, open, openSidebarEdgeDetectionWidth, width, matches]);

    const handleSidebarClose = (event: MouseEvent | TouchEvent | React.MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target && target.closest('.ignore-clickaway')) {
            return;
        }
        if (open) {
            dispatch(closeSidebar());
        }
    };

    const sidebarBottomItems = [
        { name: 'Abmelden', icon: <LogoutIcon />, url: getAuthenticationUrl() + getSignOutUrl() },
        {
            name: "Account",
            icon: (
                <Avatar
                    sx={{
                        width: 25,
                        height: 25,
                    }}
                    alt="Account"
                >
                    {`${user.me.username.slice(0, 1).toUpperCase()}`}
                </Avatar>
            ),
            url: getSettingsUrl() + getUserSettingsUrl()
        },
        { name: 'Einstellungen', icon: <SettingsIcon />, url: getSettingsUrl() + getAppSettingsUrl() },
    ];

    const SidebarBottomLegals = () => {
        return (
            <Typography
                variant="caption"
                color="text.secondary"
                align="left"
                sx={{ mt: 1 }}
            >
                <Box>
                    <Link component={RouterLink} to={getPrivacyPolicyUrl()} onClick={() => dispatch(closeSidebar())} color="inherit">
                        {"Datenschutzerklärung"}
                    </Link>{" "}
                    <Link component={RouterLink} to={getImprintUrl()} onClick={() => dispatch(closeSidebar())} color="inherit">
                        {"Impressum"}
                    </Link>
                </Box>
                <Box>
                    {"Copyright © "}
                    <Link component={RouterLink} to={getHomeUrl()} onClick={() => dispatch(closeSidebar())} color="inherit">
                        {"shareframe.de"}
                    </Link>{" "}
                    {new Date().getFullYear()}
                    {"."}
                </Box>
            </Typography>
        );
    }

    return (
        <ClickAwayListener
            mouseEvent="onMouseUp"
            touchEvent="onTouchStart"
            onClickAway={handleSidebarClose}
        >
            <Drawer
                variant={"persistent"}
                open={open}
                sx={{
                    width,
                    '& .MuiDrawer-paper': {
                        top: theme => theme.layout.appbar.height,
                        height: `calc(100% - ${theme.layout.appbar.height}px)`,
                    },
                }}
            >
                <Box
                    sx={{
                        width,
                        height: '100%',
                        backgroundColor: 'background.paper',
                        p: 1,
                        borderRadius: 1
                    }}
                    role="sidebar"
                >
                    <Box
                        sx={{
                            height: '100%',
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <List
                            sx={{
                                flex: 1
                            }}
                        >
                            {sidebarMenuItems.map((item) => {
                                const homeUrl = getHomeUrl()
                                const itemUrl = location.pathname === homeUrl ? item.url : `/${item.url}`
                                const isActive = location.pathname === itemUrl;
                                return (
                                    <ListItem
                                        component={RouterLink}
                                        to={item.url}
                                        key={item.name}
                                        onClick={handleSidebarClose}
                                        sx={{
                                            backgroundColor: isActive ? 'primary.light' : 'inherit',
                                            color: isActive ? 'primary.contrastText' : 'inherit',
                                            borderRadius: 0.5,
                                            '&:hover': {
                                                backgroundColor: isActive ? 'primary.main' : 'action.hover',
                                            },
                                        }}
                                    >
                                        <ListItemIcon><item.icon /></ListItemIcon>
                                        <ListItemText primary={item.name} />
                                    </ListItem>
                                );
                            })}
                        </List>
                        <List>
                            {sidebarBottomItems.map((item) => (
                                <ListItem
                                    component={RouterLink}
                                    to={item.url}
                                    key={item.name}
                                    onClick={handleSidebarClose}
                                    sx={{
                                        color: 'inherit',
                                        borderRadius: 0.5,
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.name} />
                                </ListItem>
                            ))}
                        </List>
                        <SidebarBottomLegals />
                    </Box>
                </Box>
            </Drawer>
        </ClickAwayListener >
    );
};

export default Sidebar;
