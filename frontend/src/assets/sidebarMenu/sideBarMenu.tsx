import { IAppBarMenuItem } from "@/types";
import { getActivityUrl, getFramesUrl, getFriendsUrl, getHomeUrl, getImageUrl } from "../endpoints/app/appEndpoints";
import GroupIcon from '@mui/icons-material/Group';
import ImageIcon from '@mui/icons-material/Image';
import HomeIcon from '@mui/icons-material/Home';
import FilterFramesIcon from '@mui/icons-material/FilterFrames';
import ShareIcon from '@mui/icons-material/Share';

export const sidebarMenuItems: IAppBarMenuItem[] = [
    {
        name: "Start",
        url: getHomeUrl(),
        icon: <HomeIcon />
    },
    {
        name: "Fotos",
        url: getImageUrl(),
        icon: <ImageIcon />
    },
    {
        name: "Aktivitäten",
        url: getActivityUrl(),
        icon: <ShareIcon />
    },
    {
        name: "Freunde",
        url: getFriendsUrl(),
        icon: <GroupIcon />
    },
    {
        name: "Bilderrahmen",
        url: getFramesUrl(),
        icon: <FilterFramesIcon />
    },
];