import { FC, ReactNode } from 'react';
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";

interface QuickAccessCardProps {
    title: string;
    icon: ReactNode;
    to: string;
}

// A real link: reachable by keyboard and can be opened in a new tab.
const QuickAccessCard: FC<QuickAccessCardProps> = ({ title, icon, to }) => {
    return (
        <Card
            sx={{
                transition: 'transform 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                },
                '@media (prefers-reduced-motion: reduce)': {
                    '&:hover': { transform: 'none' },
                },
            }}
        >
            <CardActionArea component={RouterLink} to={to}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    {icon}
                    <Typography variant="subtitle1" sx={{
                        fontWeight: "medium"
                    }}>
                        {title}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default QuickAccessCard;
