import { Box } from "@mui/material";
import NewChangelogDialog from "@/main/changelogs/dialogs/newChangelogDialog";
import BuildVersionChecker from "../buildVersionChecker";
import InstallPrompt from "../pwa/installPrompt";
import PushPrompt from "../pwa/pushPrompt";
import ShareTargetRedirect from "../pwa/shareTargetRedirect";
import ServerStatusNotice from "../serverStatus/serverStatusNotice";
import { PromptQueueProvider } from "./promptQueueProvider";

const Lifecycle: React.FC = () => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: "100%" }}>
            <PromptQueueProvider>
                <NewChangelogDialog />
                <BuildVersionChecker />
                <InstallPrompt />
                <PushPrompt />
            </PromptQueueProvider>
            <ShareTargetRedirect />
            <ServerStatusNotice />
        </Box>
    );
};

export default Lifecycle;
