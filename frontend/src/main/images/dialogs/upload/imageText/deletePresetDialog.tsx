import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { ITextPreset } from '@/types';

interface DeletePresetDialogProps {
    preset: ITextPreset | null;
    onCancel: () => void;
    onConfirm: (preset: ITextPreset) => void;
}

const DeletePresetDialog: React.FC<DeletePresetDialogProps> = ({ preset, onCancel, onConfirm }) => (
    <Dialog open={preset !== null} onClose={onCancel} maxWidth="xs" fullWidth aria-labelledby="delete-preset-title">
        <DialogTitle id="delete-preset-title">Vorlage löschen?</DialogTitle>
        <DialogContent>
            <DialogContentText sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
                {preset?.text}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onCancel}>Abbrechen</Button>
            <Button color="error" variant="contained" onClick={() => preset && onConfirm(preset)}>
                Löschen
            </Button>
        </DialogActions>
    </Dialog>
);

export default DeletePresetDialog;
