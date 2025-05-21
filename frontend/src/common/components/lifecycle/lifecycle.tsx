import { Box } from "@mui/material";
import NewChangelogDialog from "@/main/changelogs/dialogs/newChangelogDialog";
import BuildVersionChecker from "../buildVersionChecker";

const Lifecycle: React.FC = () => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: "100%" }}>
            <NewChangelogDialog />
            <BuildVersionChecker />
        </Box>
    );
};

export default Lifecycle;
