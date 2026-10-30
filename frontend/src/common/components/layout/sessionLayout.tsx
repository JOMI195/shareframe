import { lazy, Suspense, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { loadMyUserProfileShared } from "@/store/entities/authentication/authentication.actions";
import PublicLayout from "@/main/legals/layout";
import LoadingFallback from "@/common/components/loadingFallback";

const MainLayout = lazy(() => import("./layout"));

// Public pages that signed-in users reach from the app keep the app bar and sidebar.
const SessionLayout = () => {
    const dispatch = useAppDispatch();
    const me = useAppSelector(getMyUserDetails);
    const loggedIn = localStorage.getItem("loggedIn") === "true";

    useEffect(() => {
        if (loggedIn && me.id === 0) dispatch(loadMyUserProfileShared());
    }, [loggedIn, me.id, dispatch]);

    return loggedIn ? (
        <Suspense fallback={<LoadingFallback />}>
            <MainLayout />
        </Suspense>
    ) : (
        <PublicLayout />
    );
};

export default SessionLayout;
