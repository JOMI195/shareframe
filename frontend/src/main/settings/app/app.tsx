import Settings from '@/common/components/settings/settings';
import Appearance from './appearance/appearance';
import PaletteIcon from '@mui/icons-material/Palette';
import Privacy from './privacy/privacy';
import PolicyIcon from '@mui/icons-material/Policy';

const App = () => {
    const tabs = [
        {
            label: "Darstellung",
            icon: <PaletteIcon />,
            content: <Appearance />
        },
        {
            label: "Privatspähre",
            icon: <PolicyIcon />,
            content: <Privacy />
        },
    ];

    return (
        <Settings
            title="Einstellungen"
            tabs={tabs}
        />
    );
};

export default App;