import Container from "@mui/material/Container";
import { Outlet } from "react-router";
import PublicHeader from "@/common/components/layout/topLayout/publicHeader";
import PublicFooter from "@/common/components/layout/bottomLayout/publicFooter";

export default function PublicLayout() {
  return (
    <>
      <PublicHeader />
      <Container component="main" maxWidth="md" disableGutters sx={{ pt: { xs: 2, md: 5 } }}>
        <Outlet />
      </Container>
      <Container component="footer" maxWidth="lg" sx={{ py: 5 }}>
        <PublicFooter sx={{ display: "block" }} />
      </Container>
    </>
  );
}
