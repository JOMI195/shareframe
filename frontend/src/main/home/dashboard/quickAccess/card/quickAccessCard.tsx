// components/QuickAccessCard.tsx
import { FC, ReactNode } from 'react';
import { Card, CardContent, Typography } from "@mui/material";

interface QuickAccessCardProps {
    title: string;
    icon: ReactNode;
    onClick: () => void;
}

const QuickAccessCard: FC<QuickAccessCardProps> = ({ title, icon, onClick }) => {
    return (
        <Card
            sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                }
            }}
            elevation={10}
            onClick={onClick}
        >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                {icon}
                <Typography variant="subtitle1" fontWeight="medium">
                    {title}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default QuickAccessCard;