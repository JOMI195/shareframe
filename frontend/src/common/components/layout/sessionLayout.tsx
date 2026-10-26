import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { loadMyUserProfile } from "@/store/entities/authentication/authentication.actions";
import PublicLayout from "@/main/legals/layout";
import MainLayout from "./layout";

// Public pages that signed-in users reach from the app keep the app bar and sidebar.
const SessionLayout = () => {
    const dispatch = useAppDispatch();
    const me = useAppSelector(getMyUserDetails);
    const loggedIn = localStorage.getItem("loggedIn") === "true";

    useEffect(() => {
        if (loggedIn && me.id === 0) dispatch(loadMyUserProfile());
    }, [loggedIn, me.id, dispatch]);

    return loggedIn ? <MainLayout /> : <PublicLayout />;
};

export default SessionLayout;
