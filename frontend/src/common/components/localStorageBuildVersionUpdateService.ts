const BUILD_VERSION_STORAGE_KEY = 'APP_BUILD_VERSION';

const localStorageBuildVersionUpdate = () => {
    const build_env = import.meta.env.VITE_APP_BUILD_VERSION
    const currentBuildVersion = build_env !== undefined ? build_env : "unknown";

    const buildVersionStorageValue = localStorage.getItem(BUILD_VERSION_STORAGE_KEY);

    //console.log(`checking ${buildVersionStorageValue} to ${currentBuildVersion}`);
    if (buildVersionStorageValue === null) {
        localStorage.setItem(BUILD_VERSION_STORAGE_KEY, currentBuildVersion);
        return;
    }
    else if (buildVersionStorageValue !== currentBuildVersion) {
        localStorage.removeItem("persist:der-witz-des-tages-data");
        localStorage.setItem(BUILD_VERSION_STORAGE_KEY, currentBuildVersion);
        window.location.reload();
    };
}

export default localStorageBuildVersionUpdate;
