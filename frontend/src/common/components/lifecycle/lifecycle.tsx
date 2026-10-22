import { Box } from "@mui/material";
import NewChangelogDialog from "@/main/changelogs/dialogs/newChangelogDialog";
import BuildVersionChecker from "../buildVersionChecker";
import InstallPrompt from "../pwa/installPrompt";
import PushPrompt from "../pwa/pushPrompt";
import ShareTargetRedirect from "../pwa/shareTargetRedirect";
import ServerStatusNotice from "../serverStatus/serverStatusNotice";

const Lifecycle: React.FC = () => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: "100%" }}>
            <NewChangelogDialog />
            <BuildVersionChecker />
            <InstallPrompt />
            <PushPrompt />
            <ShareTargetRedirect />
            <ServerStatusNotice />
        </Box>
    );
};

export default Lifecycle;
