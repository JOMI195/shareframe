import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import IosShareIcon from '@mui/icons-material/IosShare';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { ZoomTransition } from '../dialogTransitions';

interface IosInstallDialogProps {
    open: boolean;
    onClose: () => void;
}

const steps = [
    { icon: <IosShareIcon />, text: 'Tippe in Safari auf das Teilen-Symbol.' },
    { icon: <AddBoxOutlinedIcon />, text: 'Wähle „Zum Home-Bildschirm“.' },
    { icon: <CheckIcon />, text: 'Bestätige mit „Hinzufügen“.' },
];

const IosInstallDialog: React.FC<IosInstallDialogProps> = ({ open, onClose }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            slots={{ transition: ZoomTransition }}
        >
            <DialogTitle>ShareFrame installieren</DialogTitle>
            <DialogContent>
                {steps.map((step, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                        {step.icon}
                        <Typography>{step.text}</Typography>
                    </Box>
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Verstanden</Button>
            </DialogActions>
        </Dialog>
    );
};

export default IosInstallDialog;
