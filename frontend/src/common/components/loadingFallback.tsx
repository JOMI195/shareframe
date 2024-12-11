import { CircularProgress, Container } from "@mui/material";

const LoadingFallback = () => {
    return (
        <Container
            maxWidth="sm"
            sx={{
                p: 2,
                mt: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >

            <img
                src={"/logo-light-full-shareframe.svg"}
                alt="Logo"
                style={{
                    width: '100%',
                    maxWidth: 300,
                    marginRight: 16,
                    marginBottom: 50
                }}
            />
            <CircularProgress
                size={80}
                thickness={4}
                sx={{ color: "#8b5cf6" }}
                color='inherit'
            />
        </Container>
    );
};

export default LoadingFallback;