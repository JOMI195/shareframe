import ShareframeTabs from "@/common/components/tabs";
import WifiIcon from '@mui/icons-material/Wifi';
import InfoIcon from '@mui/icons-material/Info';
import UpdateIcon from '@mui/icons-material/Update';
import FilterFramesIcon from '@mui/icons-material/FilterFrames';
import Network from "./network/network";
import General from "./general/general";
import FrameActions from "./frameActions/frameActions";
import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import Updates from "./updates/updates";
import { fetchLatestRelease } from "@/store/updates/updates.Slice";
import { startContinuousStatusCheck } from "@/store/slideshowStatus/slideshowStatus.Slice";
import { useTimer } from "@/hooks/useTimer";

const Dashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const {
        start: startAppInitialLoadTimer,
    } = useTimer({
        id: 'app-initial-load-timer',
        duration: 10,
        autoStart: false
    });

    useEffect(() => {
        const stopStatusCheck = dispatch(startContinuousStatusCheck());

        return () => {
            stopStatusCheck();
        };
    }, [dispatch]);

    useEffect(() => {
        startAppInitialLoadTimer()
        dispatch(fetchLatestRelease());
    }, [dispatch]);


    const tabs = [
        {
            label: "Steuerung",
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
        {
            label: "Updates",
            icon: <UpdateIcon />,
            content: <Updates />,
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