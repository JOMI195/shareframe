import AppBar from '@mui/material/AppBar';
import LogoutIcon from '@mui/icons-material/Logout';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useColorThemeContext } from '@/context/colorTheme/colorThemeContext';
import { Button, keyframes, Typography, useMediaQuery, useTheme } from '@mui/material';
import Logo from '../../logo';
import { usePiConnection } from '@/context/piConnection/piConnectionContext';

interface TopAppBarProps {
    onLogout: () => Promise<void>;
}


const pulseAnimation = keyframes`
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
`;

const TopAppBar: React.FC<TopAppBarProps> = ({ onLogout }) => {
    const { colorMode, toggleColorMode, iconComponent: IconComponent } = useColorThemeContext();
    const { isConnected } = usePiConnection();

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    const statusIndicator = () => {
        return (
            <>
                <Box
                    sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: isConnected ? 'green' : 'red',
                        animation: `${pulseAnimation} 1s infinite ease-in-out`,
                        marginRight: 1,
                    }} /><Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {isConnected ? 'Mit dem Bilderrahmen verbunden' : 'Keine Verbindung zum Bilderrahmen'}
                </Typography>
            </>
        )
    }


    return (
        <>
            <AppBar
                elevation={isSmallScreen ? 0 : 1}
                position="sticky"
                sx={{
                    height: theme => theme.layout.appbar.height,
                    background: theme => theme.palette.background.default,
                    zIndex: theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar sx={{ height: "100%" }}>
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
                    {!isSmallScreen && (
                        <> {statusIndicator()}</>
                    )}
                    <Tooltip title={colorMode === "dark" ? "Wechsel in den hellen Modus" : "Wechsel in den dunklen Modus"}>
                        <IconButton size={isSmallScreen ? "medium" : "medium"} onClick={toggleColorMode} sx={{ ml: 1 }}>
                            <IconComponent fontSize={isSmallScreen ? "medium" : "medium"} />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<LogoutIcon />}
                        onClick={onLogout}
                        size='small'
                        sx={{ ml: 1 }}
                    >
                        Logout
                    </Button>
                </Toolbar>

            </AppBar>
            {isSmallScreen && (
                <Box
                    sx={{
                        position: 'sticky',
                        top: theme.layout.appbar.height,
                        zIndex: 10,
                        width: '100%',
                        background: theme => theme.palette.background.default,
                        boxShadow: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingBottom: isSmallScreen ? 1 : 2,
                        paddingX: 2,
                    }}
                >
                    {statusIndicator()}
                </Box>
            )}
        </>
    );
}
export default TopAppBar;
