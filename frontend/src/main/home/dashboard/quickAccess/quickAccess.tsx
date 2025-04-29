import { FC, ReactNode } from 'react';
import { Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getImageUrl, getActivityUrl, getFriendsUrl, getFramesUrl } from "@/assets/endpoints/app/appEndpoints";
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ShareIcon from '@mui/icons-material/Share';
import PeopleIcon from '@mui/icons-material/People';
import FilterFramesIcon from '@mui/icons-material/FilterFrames';
import QuickAccessCard from './card/quickAccessCard';

interface CardInfo {
    title: string;
    icon: ReactNode;
    onClick: () => void;
}

const QuickAccess: FC = () => {
    const navigate = useNavigate();

    const cards: CardInfo[] = [
        {
            title: "Fotos",
            icon: <PhotoLibraryIcon color="primary" sx={{ fontSize: 40 }} />,
            onClick: () => navigate(getImageUrl())
        },
        {
            title: "Aktivitäten",
            icon: <ShareIcon color="secondary" sx={{ fontSize: 40 }} />,
            onClick: () => navigate(getActivityUrl())
        },
        {
            title: "Freunde",
            icon: <PeopleIcon sx={{ fontSize: 40 }} />,
            onClick: () => navigate(getFriendsUrl())
        },
        {
            title: "Bilderrahmen",
            icon: <FilterFramesIcon sx={{ fontSize: 40 }} />,
            onClick: () => navigate(getFramesUrl())
        }
    ];

    return (
        <Grid container spacing={1} sx={{ mb: 2 }}>
            {cards.map((card, index) => (
                <Grid item xs={6} sm={3} key={index}>
                    <QuickAccessCard
                        title={card.title}
                        icon={card.icon}
                        onClick={card.onClick}
                    />
                </Grid>
            ))}
        </Grid>
    );
};

export default QuickAccess;