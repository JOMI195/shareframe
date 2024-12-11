import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Tooltip from '@mui/material/Tooltip';
import { useColorThemeContext } from '@/context/colorTheme/colorThemeContext';
import { Divider, useMediaQuery, useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeSidebar, getSidebar, openSidedbar } from '@/store/ui/navigation/navigation.slice';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Logo from '../../logo';

function TopAppBar() {
    const { colorMode, toggleColorMode, iconComponent: IconComponent } = useColorThemeContext();
    const sidebarOpen = useAppSelector(getSidebar).open;

    const dispatch = useAppDispatch();
    const theme = useTheme();

    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    const handleSidebarButtonClick = () => {
        dispatch(sidebarOpen ? closeSidebar() : openSidedbar());
    }

    return (
        <AppBar
            elevation={1}
            position="sticky"
            sx={{
                height: theme => theme.layout.appbar.height,
                background: theme => theme.palette.background.default,
                zIndex: theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar sx={{ height: "100%" }}>
                <IconButton
                    size="small"
                    aria-label="account of current user"
                    aria-haspopup="true"
                    onClick={handleSidebarButtonClick}
                    className='ignore-clickaway'
                    sx={{ mr: 1 }}
                >
                    {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
                <Logo
                    darkLogoSrc="/logo-dark-full-shareframe.svg"
                    lightLogoSrc="/logo-light-full-shareframe.svg"
                    maxWidth={130}
                    marginRight={0}
                    clickable={false}
                />
                <Box
                    sx={{
                        flex: 1
                    }}
                />
                <Tooltip title={colorMode === "dark" ? "Wechsel in den hellen Modus" : "Wechsel in den dunklen Modus"}>
                    <IconButton size={isSmallScreen ? "medium" : "medium"} onClick={toggleColorMode}>
                        <IconComponent fontSize={isSmallScreen ? "medium" : "medium"} />
                    </IconButton>
                </Tooltip>
                <Divider />
            </Toolbar>
        </AppBar>
    );
}
export default TopAppBar;
