import { IAppBarMenuItem } from "@/types";
import { getActivityUrl, getFramesUrl, getFriendsUrl, getHomeUrl } from "../endpoints/app/appEndpoints";
import GroupIcon from '@mui/icons-material/Group';
import ImageIcon from '@mui/icons-material/Image';
import FilterFramesIcon from '@mui/icons-material/FilterFrames';
import NoteIcon from '@mui/icons-material/Note';

export const sidebarMenuItems: IAppBarMenuItem[] = [
    {
        name: "Fotos",
        url: getHomeUrl(),
        icon: ImageIcon
    },
    {
        name: "Aktivität",
        url: getActivityUrl(),
        icon: NoteIcon
    },
    {
        name: "Freunde",
        url: getFriendsUrl(),
        icon: GroupIcon
    },
    {
        name: "Bilderrahmen",
        url: getFramesUrl(),
        icon: FilterFramesIcon
    },
];