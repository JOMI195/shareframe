import { Container } from "@mui/material";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {

  return (
    <Container
      disableGutters
      sx={{
        flex: '1 1 auto',
        display: 'flex',
        alignItems: "center",
        flexDirection: 'column',
      }}
      maxWidth={"md"}
    >
      {children}
      {/* <Box
        sx={{ mt: 5 }}
      >
        <BuildVersionInfo />
      </Box> */}
    </Container>
  );
}

export default Layout;