import ShareframeTabs from "@/common/components/tabs";
import WifiIcon from '@mui/icons-material/Wifi';
import InfoIcon from '@mui/icons-material/Info';
import UpdateIcon from '@mui/icons-material/Update';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
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
import { fetchFrameInfos } from "@/store/frameInfo/frameInfo.Slice";
import { fetchNetworkData } from "@/store/network/network.Slice";
import { usePiConnection } from "@/context/piConnection/piConnectionContext";
import FrameLogs from "./frameLogs/frameLogs";

const Dashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isConnected } = usePiConnection();
    const { reset: resetAppIntitialLoadTimer, start: startAppIntitialLoadTimer } = useTimer({
        id: 'app-initial-load-timer',
        duration: 20,
    });

    useEffect(() => {
        const stopStatusCheck = dispatch(startContinuousStatusCheck());

        return () => {
            stopStatusCheck();
        };
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchNetworkData());
    }, [isConnected, dispatch]);

    useEffect(() => {
        resetAppIntitialLoadTimer();
        startAppIntitialLoadTimer();
        dispatch(fetchFrameInfos());
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
            label: "Updates",
            icon: <UpdateIcon />,
            content: <Updates />,
        },
        {
            label: "Gerät",
            icon: <InfoIcon />,
            content: <General />,
        },
        {
            label: "Logs",
            icon: <HomeRepairServiceIcon />,
            content: <FrameLogs />,
        },
    ];

    return (
        <ShareframeTabs
            title="Bilderrahmen - Dashboard"
            tabs={tabs}
        />
    );
};

export default Dashboard;