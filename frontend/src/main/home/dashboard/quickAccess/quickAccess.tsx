import { FC, ReactNode } from 'react';
import { Grid } from "@mui/material";
import { getImageUrl, getActivityUrl, getFriendsUrl, getFramesUrl } from "@/assets/endpoints/app/appEndpoints";
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ShareIcon from '@mui/icons-material/Share';
import PeopleIcon from '@mui/icons-material/People';
import FilterFramesIcon from '@mui/icons-material/FilterFrames';
import QuickAccessCard from './card/quickAccessCard';

interface CardInfo {
    title: string;
    icon: ReactNode;
    to: string;
}

const QuickAccess: FC = () => {
    const cards: CardInfo[] = [
        {
            title: "Fotos",
            icon: <PhotoLibraryIcon color="primary" sx={{ fontSize: 40 }} />,
            to: "/" + getImageUrl()
        },
        {
            title: "Aktivitäten",
            icon: <ShareIcon color="secondary" sx={{ fontSize: 40 }} />,
            to: "/" + getActivityUrl()
        },
        {
            title: "Freunde",
            icon: <PeopleIcon sx={{ fontSize: 40 }} />,
            to: "/" + getFriendsUrl()
        },
        {
            title: "Bilderrahmen",
            icon: <FilterFramesIcon sx={{ fontSize: 40 }} />,
            to: "/" + getFramesUrl()
        }
    ];

    return (
        <Grid container spacing={1} sx={{ mb: 2 }}>
            {cards.map((card, index) => (
                <Grid
                    key={index}
                    size={{
                        xs: 6,
                        sm: 3
                    }}>
                    <QuickAccessCard
                        title={card.title}
                        icon={card.icon}
                        to={card.to}
                    />
                </Grid>
            ))}
        </Grid>
    );
};

export default QuickAccess;