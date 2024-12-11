import { Box, Typography } from "@mui/material";

const BuildVersionInfo = () => {
  const currentBuildVersion = import.meta.env.VITE_APP_BUILD_VERSION

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary" align='center'>
        {currentBuildVersion !== undefined
          ? `app-version: ${currentBuildVersion}`
          : `app-version: unknown`
        }
      </Typography>
    </Box>
  );
};

export default BuildVersionInfo;