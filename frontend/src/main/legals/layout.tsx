import Container from "@mui/material/Container";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <Container component="main" maxWidth="xl" disableGutters sx={{ my: 5, }}>
      <Outlet />
    </Container>
  );
}
