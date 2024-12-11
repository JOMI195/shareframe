import { useAppSelector } from "@/store";
import { getMyUserDetails } from "@/store/entities/authentication/authentication.slice";
import { IUser } from "@/types";
import { TextField } from "@mui/material";

const Email = () => {
    const me: IUser = useAppSelector(getMyUserDetails);

    return (
        <TextField
            id='email'
            label={'Email'}
            value={me.email}
            disabled
            fullWidth
            variant="filled"
        />
    );
}

export default Email;