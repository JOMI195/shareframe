import React from 'react';
import { Box, Typography, Grid, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { getContactUrl } from '@/assets/endpoints/app/appEndpoints';
import { getAppSettingsUrl, getSettingsUrl } from '@/assets/endpoints/app/settingEndpoints';
import { getImprintUrl, getPrivacyPolicyUrl } from '@/assets/endpoints/app/legalEndpoints';
import Logo from '../../logo';

const StyledLink = styled(Link)(({ }) => ({
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
        textDecoration: 'none',
        opacity: 0.8,
    },
    '&:visited': {
        color: 'inherit',
    },
}));

const Footer: React.FC = () => {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: 'background.paper',
                py: 2,
                // height: theme.layout.footer.height,
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={1} textAlign={{ xs: "center", sm: "inherit" }} alignItems={"center"} justifyContent={{ xs: "center" }}>
                    <Grid item xs={12} container sx={{ display: "flex", justifyContent: "center", flexDirection: "row" }}>
                        <Grid item xs={12} md={3} sx={{ display: "flex", justifyContent: "space-around", flexDirection: "row" }}>
                            <StyledLink to={getSettingsUrl() + getAppSettingsUrl()} color="inherit">
                                Einstellungen
                            </StyledLink>
                        </Grid>
                        <Grid item xs={12} md={3} sx={{ display: "flex", justifyContent: "center", flexDirection: "row" }}>
                            <StyledLink to={getContactUrl()} color="inherit">
                                Kontaktformular
                            </StyledLink>
                        </Grid>
                        <Grid item xs={12} md={3} sx={{ display: "flex", justifyContent: "center", flexDirection: "row" }}>
                            <StyledLink to={getPrivacyPolicyUrl()} color="inherit">
                                Datenschutzerklärung
                            </StyledLink>
                        </Grid>
                        <Grid item xs={12} md={3} sx={{ display: "flex", justifyContent: "center", flexDirection: "row" }}>
                            <StyledLink to={getImprintUrl()} color="inherit">
                                Impressum
                            </StyledLink>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", flexDirection: "row" }}>
                        <Logo
                            darkLogoSrc="/logo-dark-full-shareframe.svg"
                            lightLogoSrc="/logo-light-full-shareframe.svg"
                            maxWidth={200}
                            marginRight={0}
                            clickable={true}
                        />
                    </Grid>
                    <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", flexDirection: "row" }}>
                        {" Made with ❤️ by Johannes"}
                    </Grid>
                    <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", flexDirection: "row" }}>
                        <Typography variant="body1">
                            {"Copyright © "}
                            <StyledLink to="/" color="inherit">
                                der-witz-des-tages.de
                            </StyledLink>
                            {" "}
                            {new Date().getFullYear()}
                        </Typography>
                    </Grid>
                    {/* <Grid item xs={12} md={3} sx={{ display: "flex", justifyContent: "center", flexDirection: "row" }}>
                        <Box sx={{ mr: 1 }}>
                            <StyledLink to="/impressum" color="inherit">
                                Impressum
                            </StyledLink>
                        </Box>
                        <Box sx={{ mr: 1 }}>
                            <StyledLink to="/datenschutz" color="inherit">
                                Datenschutzerklärung
                            </StyledLink>
                        </Box>
                        <StyledLink to="/agb" color="inherit">
                            AGB
                        </StyledLink>
                    </Grid> */}
                </Grid>
            </Container>
        </Box>
    );
}

export default Footer;