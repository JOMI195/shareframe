import { useAppDispatch } from "@/store";
import { setSelectedFeature } from "@/store/ui/navigation/navigation.slice";
import { Container } from "@mui/material";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

interface FeatureSelectorWrapperProps {
    feature: string;
}

const FeatureSelectorWrapper: React.FC<FeatureSelectorWrapperProps> = ({ feature }) => {
    const dispatch = useAppDispatch();
    const location = useLocation();

    useEffect(() => {
        dispatch(setSelectedFeature(feature));
    }, [location.pathname, dispatch, feature]);

    return (
        <Container>
            <Outlet />
        </Container>
    );
}

export default FeatureSelectorWrapper;
