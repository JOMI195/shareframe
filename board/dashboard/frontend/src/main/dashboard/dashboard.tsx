import ShareframeTabs from "@/common/components/tabs";
import WifiIcon from '@mui/icons-material/Wifi';
import InfoIcon from '@mui/icons-material/Info';
import FilterFramesIcon from '@mui/icons-material/FilterFrames';
import Network from "./network/network";
import General from "./general/general";
import FrameActions from "./frameActions/frameActions";

const Dashboard: React.FC = () => {

    const tabs = [
        {
            label: "Allgemein",
            icon: <FilterFramesIcon />,
            content: <FrameActions />,
        },
        {
            label: "Netzwerk",
            icon: <WifiIcon />,
            content: <Network />,
        },
        {
            label: "Gerät",
            icon: <InfoIcon />,
            content: <General />,
        },
    ];

    return (
        <ShareframeTabs
            title="Bilderrahmen"
            tabs={tabs}
        />
    );
};

export default Dashboard;