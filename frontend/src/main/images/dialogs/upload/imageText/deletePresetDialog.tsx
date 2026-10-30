import React from 'react';
import { DialogContentText } from '@mui/material';
import ConfirmDialog from '@/common/components/confirmDialog';
import { ITextPreset } from '@/types';

interface DeletePresetDialogProps {
    preset: ITextPreset | null;
    onCancel: () => void;
    onConfirm: (preset: ITextPreset) => void;
}

const DeletePresetDialog: React.FC<DeletePresetDialogProps> = ({ preset, onCancel, onConfirm }) => (
    <ConfirmDialog
        open={preset !== null}
        title="Vorlage löschen?"
        confirmLabel="Löschen"
        destructive
        onConfirm={() => preset && onConfirm(preset)}
        onCancel={onCancel}
    >
        <DialogContentText sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
            {preset?.text}
        </DialogContentText>
    </ConfirmDialog>
);

export default DeletePresetDialog;
