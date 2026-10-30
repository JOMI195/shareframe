import React, { useEffect } from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Box,
    SwipeableDrawer,
    useTheme,
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
import { Link as RouterLink, useLocation } from 'react-router';
import { getUser } from '@/store/entities/authentication/authentication.slice';
import UserAvatar from '@/common/components/userAvatar';
import { getAppSettingsUrl, getSettingsUrl, getUserSettingsUrl } from '@/assets/endpoints/app/settingEndpoints';
import { sidebarMenuItems } from '@/assets/sidebarMenu/sideBarMenu';
import { IAppBarMenuItem } from '@/types';
import { getAuthenticationUrl, getSignOutUrl } from '@/assets/endpoints/app/authEndpoints';
import { getChangelogsUrl, getContactUrl, getDashboardUrl } from '@/assets/endpoints/app/appEndpoints';
import { getImprintUrl, getPrivacyPolicyUrl } from '@/assets/endpoints/app/legalEndpoints';
import { useBackToClose } from '@/hooks/navigation/useBackToClose';
import { SIDEBAR_ICON_WIDTH, SIDEBAR_WIDTH } from './sidebarWidth';

const Sidebar: React.FC = () => {
    const dispatch = useAppDispatch();
    const open = useAppSelector(getSidebar).open;
    const theme = useTheme();
    const location = useLocation();

    const user = useAppSelector(getUser);

    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
    const shouldShowIconsOnly = isDesktop && !open;
    const currentWidth = shouldShowIconsOnly ? SIDEBAR_ICON_WIDTH : SIDEBAR_WIDTH;

    useEffect(() => {
        if (isDesktop) {
            dispatch(openSidedbar());
        }
    }, [dispatch, isDesktop]);

    // Below desktop the drawer is a modal: it closes on navigation and on the back button.
    useEffect(() => {
        if (!isDesktop) dispatch(closeSidebar());
    }, [dispatch, isDesktop, location.pathname]);

    useBackToClose(!isDesktop && open, () => dispatch(closeSidebar()));

    // A link to another page closes the drawer through the route change; closing here as well
    // would take its history entry back while the router is still navigating.
    const handleItemClick = (itemUrl: string) => {
        if (!isDesktop && itemUrl === location.pathname) dispatch(closeSidebar());
    };

    const sidebarBottomItems = [
        {
            name: "Konto",
            icon: <UserAvatar username={user.me.username} url={user.me.account?.avatar} size={25} />,
            url: getSettingsUrl() + getUserSettingsUrl()
        },
        { name: 'Einstellungen', icon: <SettingsIcon />, url: getSettingsUrl() + getAppSettingsUrl() },
        { name: 'Änderungen', icon: <TipsAndUpdatesIcon />, url: getChangelogsUrl() },
        { name: 'Abmelden', icon: <LogoutIcon />, url: getAuthenticationUrl() + getSignOutUrl() },
    ];

    const renderBottomLegals = () => {
        return (
            <Typography
                variant="caption"
                align="left"
                sx={{
                    color: "text.secondary",
                    mt: 1
                }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start"
                    }}
                >
                    <Link component={RouterLink} to={getContactUrl()} color="inherit">
                        {"Kontakt"}
                    </Link>
                    <Link component={RouterLink} to={getImprintUrl()} color="inherit">
                        {"Impressum"}
                    </Link>
                    <Link component={RouterLink} to={getPrivacyPolicyUrl()} color="inherit">
                        {"Datenschutzerklärung"}
                    </Link>
                </Box>
                <Box>
                    {"Copyright © "}
                    <Link component={RouterLink} to={getDashboardUrl()} color="inherit">
                        {"shareframe.de"}
                    </Link>{" "}
                    {new Date().getFullYear()}
                    {"."}
                </Box>
            </Typography>
        );
    }


    const renderListItem = (item: IAppBarMenuItem) => {
        const itemUrl = item.url.startsWith("/") ? item.url : `/${item.url}`;
        const isActive = !item.url.includes(getSignOutUrl()) && location.pathname.startsWith(itemUrl);

        const listItemContent = (
            <ListItem
                component={RouterLink}
                to={itemUrl}
                key={item.name}
                onClick={() => handleItemClick(itemUrl)}
                aria-current={isActive ? 'page' : undefined}
                sx={{
                    backgroundColor: isActive ? 'primary.main' : 'inherit',
                    color: isActive ? 'primary.contrastText' : 'inherit',
                    borderRadius: 0.5,
                    //px: shouldShowIconsOnly ? 1 : 2,
                    minHeight: 48,
                    '&:hover': {
                        backgroundColor: isActive ? 'primary.dark' : 'action.hover',
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

    const content = (
        <Box
            sx={{
                width: currentWidth,
                height: '100%',
                p: 1,
                '&:hover': {
                    backgroundColor: isDesktop && !open ? 'action.hover' : "none",
                },
            }}
        >
            <Box
                component="nav"
                aria-label="Hauptmenü"
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
                    {sidebarBottomItems.map((item) => renderListItem(item))}
                </List>
                {!shouldShowIconsOnly && renderBottomLegals()}
            </Box>
        </Box>
    );

    const paperSx = {
        top: theme.layout.appbar.height,
        height: `calc(100% - ${theme.layout.appbar.height}px)`,
        width: currentWidth,
        overflowX: 'hidden',
        // Same surface as the desktop sidebar; dark mode would lighten the modal drawer.
        backgroundImage: 'none',
    };

    if (!isDesktop) {
        return (
            <SwipeableDrawer
                open={open}
                onOpen={() => dispatch(openSidedbar())}
                onClose={() => dispatch(closeSidebar())}
                disableSwipeToOpen
                ModalProps={{ keepMounted: true }}
                sx={{ '& .MuiDrawer-paper': paperSx }}
            >
                {content}
            </SwipeableDrawer>
        );
    }

    return (
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
                        ...paperSx,
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.standard,
                        }),
                    },
                }}
            >
                {content}
            </Drawer>
        </Box>
    );
};

export default Sidebar;