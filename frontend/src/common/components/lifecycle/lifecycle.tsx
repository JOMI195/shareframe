import { Box } from "@mui/material";
import NewChangelogDialog from "@/main/changelogs/dialogs/newChangelogDialog";
import BuildVersionChecker from "../buildVersionChecker";
import InstallPrompt from "../pwa/installPrompt";
import ShareTargetRedirect from "../pwa/shareTargetRedirect";

const Lifecycle: React.FC = () => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: "100%" }}>
            <NewChangelogDialog />
            <BuildVersionChecker />
            <InstallPrompt />
            <ShareTargetRedirect />
        </Box>
    );
};

export default Lifecycle;
