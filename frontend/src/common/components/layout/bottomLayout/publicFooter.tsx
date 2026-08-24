import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import { Link as RouterLink } from "react-router";
import { getContactUrl, getHomeUrl } from "@/assets/endpoints/app/appEndpoints";
import { getImprintUrl, getPrivacyPolicyUrl } from "@/assets/endpoints/app/legalEndpoints";

const PublicFooter = (props: TypographyProps) => {
  return (
    <Typography variant="caption" color="text.secondary" align="center" {...props}>
      <Box>
        <Link component={RouterLink} to={"/" + getContactUrl()} color="inherit">
          {"Kontakt"}
        </Link>{" "}
        <Link component={RouterLink} to={"/" + getPrivacyPolicyUrl()} color="inherit">
          {"Datenschutzerklärung"}
        </Link>{" "}
        <Link component={RouterLink} to={"/" + getImprintUrl()} color="inherit">
          {"Impressum"}
        </Link>
      </Box>
      <Box>
        {"Copyright © "}
        <Link component={RouterLink} to={getHomeUrl()} color="inherit">
          {"shareframe.de"}
        </Link>{" "}
        {new Date().getFullYear()}
        {"."}
      </Box>
    </Typography>
  );
};

export default PublicFooter;
