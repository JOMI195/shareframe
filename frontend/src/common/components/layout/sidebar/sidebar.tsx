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
    Link,
    Tooltip
} from '@mui/material';
import {
    Settings as SettingsIcon,
} from '@mui/icons-material';
import LogoutIcon from '@mui/icons-material/Logout';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeSidebar, getSidebar, openSidedbar } from '@/store/ui/navigation/navigation.slice';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { getUser } from '@/store/entities/authentication/authentication.slice';
import { getAppSettingsUrl, getSettingsUrl, getUserSettingsUrl } from '@/assets/endpoints/app/settingEndpoints';
import { sidebarMenuItems } from '@/assets/sidebarMenu/sideBarMenu';
import { getAuthenticationUrl, getSignOutUrl } from '@/assets/endpoints/app/authEndpoints';
import { getChangelogsUrl, getContactUrl, getHomeUrl } from '@/assets/endpoints/app/appEndpoints';
import { getImprintUrl, getPrivacyPolicyUrl } from '@/assets/endpoints/app/legalEndpoints';

const Sidebar: React.FC = () => {
    const dispatch = useAppDispatch();
    const open = useAppSelector(getSidebar).open;
    const theme = useTheme();
    const location = useLocation();

    const user = useAppSelector(getUser);

    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const fullWidth = 240;
    const iconOnlyWidth = 75;
    const shouldShowIconsOnly = isDesktop && !open;
    const currentWidth = shouldShowIconsOnly ? iconOnlyWidth : fullWidth;

    useEffect(() => {
        if (isDesktop) {
            dispatch(openSidedbar());
        }
    }, []);

    const handleSidebarClose = (event: MouseEvent | TouchEvent | React.MouseEvent) => {
        // Don't close sidebar on desktop when in icon-only mode
        if (isDesktop || shouldShowIconsOnly) {
            return;
        }

        const target = event.target as HTMLElement;
        if (target && target.closest('.ignore-clickaway')) {
            return;
        }
        if (open) {
            dispatch(closeSidebar());
        }
    };

    const sidebarBottomItems = [
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
        { name: 'Änderungen', icon: <TipsAndUpdatesIcon />, url: getChangelogsUrl() },
        { name: 'Abmelden', icon: <LogoutIcon />, url: getAuthenticationUrl() + getSignOutUrl() },
    ];

    const SidebarBottomLegals: React.FC = () => {
        return (
            <Typography
                variant="caption"
                color="text.secondary"
                align="left"
                sx={{ mt: 1 }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start"
                    }}
                >
                    <Link component={RouterLink} to={getContactUrl()} onClick={() => dispatch(closeSidebar())} color="inherit">
                        {"Kontakt"}
                    </Link>
                    <Link component={RouterLink} to={getImprintUrl()} onClick={() => dispatch(closeSidebar())} color="inherit">
                        {"Impressum"}
                    </Link>
                    <Link component={RouterLink} to={getPrivacyPolicyUrl()} onClick={() => dispatch(closeSidebar())} color="inherit">
                        {"Datenschutzerklärung"}
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


    const renderListItem = (item: any, isBottomItem = false) => {
        const homeUrl = getHomeUrl();
        const itemUrl = !isBottomItem && location.pathname === homeUrl ? item.url : `/${item.url}`;
        const isActive = !isBottomItem && location.pathname === itemUrl;

        const listItemContent = (
            <ListItem
                component={RouterLink}
                to={item.url}
                key={item.name}
                onClick={handleSidebarClose}
                sx={{
                    backgroundColor: isActive ? 'primary.light' : 'inherit',
                    color: isActive ? 'primary.contrastText' : 'inherit',
                    borderRadius: 0.5,
                    //px: shouldShowIconsOnly ? 1 : 2,
                    minHeight: 48,
                    '&:hover': {
                        backgroundColor: isActive ? 'primary.main' : 'action.hover',
                    },
                }}
            >
                <ListItemIcon
                    sx={{
                        width: shouldShowIconsOnly ? '100%' : 'auto',
                        minWidth: shouldShowIconsOnly ? 'auto' : 50,
                        justifyContent: 'flex-start',
                        //mr: shouldShowIconsOnly ? 0 : 2,
                    }}
                >
                    {item.icon}
                </ListItemIcon>
                {!shouldShowIconsOnly && <ListItemText primary={item.name} />}
            </ListItem>
        );

        // Wrap with tooltip when showing icons only
        if (shouldShowIconsOnly) {
            return (
                <Tooltip key={item.name} title={item.name} placement="right">
                    {listItemContent}
                </Tooltip>
            );
        }

        return listItemContent;
    };

    return (
        <ClickAwayListener
            mouseEvent="onMouseUp"
            touchEvent="onTouchStart"
            onClickAway={handleSidebarClose}
        >
            <Box
                onClickCapture={(e) => {
                    // Prevent sidebar from opening if a list item or its child is clicked
                    const target = e.target as HTMLElement;
                    const isListItemClick = target.closest('.MuiListItem-root');

                    if (shouldShowIconsOnly && !open && !isListItemClick) {
                        dispatch(openSidedbar());
                    }
                }}
                sx={{
                    cursor: shouldShowIconsOnly ? 'pointer' : 'default',
                }}
            >
                <Drawer
                    variant="persistent"
                    open={open || shouldShowIconsOnly}
                    sx={{
                        width: currentWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            top: theme => theme.layout.appbar.height,
                            height: `calc(100% - ${theme.layout.appbar.height}px)`,
                            width: currentWidth,
                            transition: theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.standard,
                            }),
                            overflowX: 'hidden',

                        },
                    }}
                >
                    <Box
                        sx={{
                            width: currentWidth,
                            height: '100%',
                            backgroundColor: 'background.paper',
                            p: 1,
                            borderRadius: 1,
                            '&:hover': {
                                backgroundColor: !open ? 'action.hover' : "none",
                            },
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
                                {sidebarMenuItems.map((item) => renderListItem(item))}
                            </List>
                            <List>
                                {sidebarBottomItems.map((item) => renderListItem(item, true))}
                            </List>
                            {!shouldShowIconsOnly && <SidebarBottomLegals />}
                        </Box>
                    </Box>
                </Drawer>
            </Box>
        </ClickAwayListener>
    );
};

export default Sidebar;