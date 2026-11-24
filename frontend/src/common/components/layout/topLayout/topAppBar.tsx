import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Tooltip from '@mui/material/Tooltip';
import { useColorThemeContext } from '@/context/colorTheme/colorThemeContextValue';
import { Divider, useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeSidebar, getSidebar, openSidedbar } from '@/store/ui/navigation/navigation.slice';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Logo from '../../logo';
import { getDashboardUrl } from '@/assets/endpoints/app/appEndpoints';
import SeasonalLogoBadge from '../../seasonal/seasonalLogoBadge';
import SeasonalAppBar from '../../seasonal/seasonalAppBar';

function TopAppBar() {
    const { colorMode, toggleColorMode, iconComponent: IconComponent } = useColorThemeContext();
    const sidebarOpen = useAppSelector(getSidebar).open;

    const dispatch = useAppDispatch();
    const theme = useTheme();


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
            <SeasonalAppBar />
            <Toolbar sx={{ height: "100%" }}>
                <IconButton
                    aria-label={`Menü ${sidebarOpen ? "schließen" : "öffnen"}`}
                    aria-expanded={sidebarOpen}
                    onClick={handleSidebarButtonClick}
                    className='ignore-clickaway'
                    sx={{ mr: 1, width: 44, height: 44 }}
                >
                    {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
                <SeasonalLogoBadge>
                    <Logo
                        darkLogoSrc="/logo-dark-full-shareframe.svg"
                        lightLogoSrc="/logo-light-full-shareframe.svg"
                        maxWidth={130}
                        marginRight={0}
                        linkUrl={getDashboardUrl()}
                        alt="ShareFrame – Start"
                    />
                </SeasonalLogoBadge>
                <Box
                    sx={{
                        flex: 1
                    }}
                />
                <Tooltip title={colorMode === "dark" ? "Wechsel in den hellen Modus" : "Wechsel in den dunklen Modus"}>
                    <IconButton
                        onClick={toggleColorMode}
                        aria-label={colorMode === "dark" ? "Wechsel in den hellen Modus" : "Wechsel in den dunklen Modus"}
                        sx={{ width: 44, height: 44 }}
                    >
                        <IconComponent />
                    </IconButton>
                </Tooltip>
                <Divider />
            </Toolbar>
        </AppBar>
    );
}
export default TopAppBar;
