import React, { useState } from 'react';
import {
    Box,
    Button,
    Chip,
    MenuItem,
    Select,
    Slider,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import CancelIcon from '@mui/icons-material/Cancel';
import WrapTextIcon from '@mui/icons-material/WrapText';
import { ITextPreset } from '@/types';
import DeletePresetDialog from './deletePresetDialog';
import { FONTS, MIN_FONT_SIZE, TextColor, TextFont, TextOverlay } from './textOverlays';

const CHIP_LABEL_MAX_LENGTH = 20;

const rowSx = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    borderRadius: 1,
    bgcolor: (theme: Theme) => theme.palette.background.default,
    px: 2,
    py: 1,
    mt: 1,
    gap: 1,
};

const actionButtonSx = {
    bgcolor: (theme: Theme) => theme.palette.background.default,
    color: (theme: Theme) => theme.palette.text.primary,
};

const twoColumnsSx = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1 };

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <Box sx={rowSx}>
        <Typography variant="body2" sx={{ width: 60, flexShrink: 0 }}>
            {label}
        </Typography>
        {children}
    </Box>
);

const chipLabel = (text: string) => {
    const firstLine = text.split('\n')[0].trim() || '…';
    return firstLine.length > CHIP_LABEL_MAX_LENGTH ? `${firstLine.slice(0, CHIP_LABEL_MAX_LENGTH)}…` : firstLine;
};

interface TextToolbarProps {
    overlays: TextOverlay[];
    maxFontSize: number;
    selected: TextOverlay | null;
    disabled: boolean;
    onAddText: () => void;
    onAddDate: () => void;
    onSelect: (id: string) => void;
    onChange: (overlay: TextOverlay) => void;
    onDelete: (id: string) => void;
    presets: ITextPreset[];
    savingPreset: boolean;
    onAddPreset: (preset: ITextPreset) => void;
    onSavePreset: (overlay: TextOverlay) => void;
    onDeletePreset: (preset: ITextPreset) => void;
}

const TextToolbar: React.FC<TextToolbarProps> = ({
    overlays,
    maxFontSize,
    selected,
    disabled,
    onAddText,
    onAddDate,
    onSelect,
    onChange,
    onDelete,
    presets,
    savingPreset,
    onAddPreset,
    onSavePreset,
    onDeletePreset,
}) => {
    const [presetToDelete, setPresetToDelete] = useState<ITextPreset | null>(null);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={twoColumnsSx}>
                <Button startIcon={<TextFieldsIcon />} sx={actionButtonSx} onClick={onAddText} disabled={disabled} aria-label="Text hinzufügen">
                    Text
                </Button>
                <Button startIcon={<EventIcon />} sx={actionButtonSx} onClick={onAddDate} disabled={disabled} aria-label="Datum hinzufügen">
                    Datum
                </Button>
            </Box>

            {presets.length > 0 && (
                <Row label="Vorlagen">
                    <Box role="group" aria-label="Vorlagen" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {presets.map((preset) => (
                            <Chip
                                key={preset.id}
                                label={chipLabel(preset.text)}
                                size="small"
                                variant="outlined"
                                disabled={disabled}
                                onClick={() => onAddPreset(preset)}
                                onDelete={() => setPresetToDelete(preset)}
                                deleteIcon={<CancelIcon titleAccess="Vorlage löschen" />}
                            />
                        ))}
                    </Box>
                </Row>
            )}

            {overlays.length > 0 && (
                <Row label="Texte">
                    <Box role="group" aria-label="Texte" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {overlays.map((overlay) => (
                            <Chip
                                key={overlay.id}
                                label={chipLabel(overlay.text)}
                                size="small"
                                color={overlay.id === selected?.id ? 'primary' : 'default'}
                                variant={overlay.id === selected?.id ? 'filled' : 'outlined'}
                                aria-pressed={overlay.id === selected?.id}
                                onClick={() => onSelect(overlay.id)}
                            />
                        ))}
                    </Box>
                </Row>
            )}

            {overlays.length > 0 && !selected && (
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    Tippe auf einen Text, um ihn zu bearbeiten.
                </Typography>
            )}

            {selected && (
                <Box
                    role="group"
                    aria-label="Ausgewählter Text"
                    sx={{ mt: 2, p: 1, pt: 0.5, border: 2, borderColor: 'primary.main', borderRadius: 1 }}
                >
                    <Typography variant="overline" sx={{ color: 'primary.main', px: 1 }}>
                        Ausgewählter Text
                    </Typography>
                    <Box sx={{ ...rowSx, mt: 0 }}>
                        <TextField
                            label="Text"
                            value={selected.text}
                            onChange={(e) => onChange({ ...selected, text: e.target.value })}
                            multiline
                            maxRows={4}
                            fullWidth
                            size="small"
                            sx={{ bgcolor: 'background.paper' }}
                        />
                    </Box>
                    <Row label="Farbe">
                        <ToggleButtonGroup
                            value={selected.color}
                            exclusive
                            size="small"
                            fullWidth
                            aria-label="Textfarbe"
                            onChange={(_, color: TextColor | null) => color && onChange({ ...selected, color })}
                            sx={{ bgcolor: 'background.paper' }}
                        >
                            <ToggleButton value="black">Schwarz</ToggleButton>
                            <ToggleButton value="white">Weiß</ToggleButton>
                        </ToggleButtonGroup>
                        <Tooltip title="Hintergrund in Gegenfarbe">
                            <ToggleButton
                                value="background"
                                size="small"
                                selected={selected.background}
                                aria-label="Hintergrund"
                                onChange={() => onChange({ ...selected, background: !selected.background })}
                                sx={{ bgcolor: 'background.paper' }}
                            >
                                <FormatColorFillIcon />
                            </ToggleButton>
                        </Tooltip>
                    </Row>
                    <Row label="Schrift">
                        <Select
                            value={selected.font}
                            size="small"
                            inputProps={{ 'aria-label': 'Schriftart' }}
                            onChange={(e) => onChange({ ...selected, font: e.target.value as TextFont })}
                            sx={{ flex: 1, bgcolor: 'background.paper' }}
                        >
                            {Object.entries(FONTS).map(([key, { label, family }]) => (
                                <MenuItem key={key} value={key} sx={{ fontFamily: family }}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                        <ToggleButton
                            value="bold"
                            size="small"
                            selected={selected.bold}
                            aria-label="Fett"
                            onChange={() => onChange({ ...selected, bold: !selected.bold })}
                            sx={{ bgcolor: 'background.paper' }}
                        >
                            <FormatBoldIcon />
                        </ToggleButton>
                    </Row>
                    {/* Dragging the handles has no keyboard equivalent, these do the same. */}
                    <Row label="Größe">
                        <Slider
                            value={selected.fontSize}
                            min={MIN_FONT_SIZE}
                            max={Math.max(maxFontSize, selected.fontSize)}
                            onChange={(_, fontSize) => onChange({ ...selected, fontSize: fontSize as number })}
                            aria-label="Textgröße"
                            sx={{ mx: 1 }}
                        />
                    </Row>
                    <Row label="Drehung">
                        <Slider
                            value={selected.rotation}
                            min={-180}
                            max={180}
                            marks={[{ value: 0 }]}
                            onChange={(_, rotation) => onChange({ ...selected, rotation: rotation as number })}
                            aria-label="Textdrehung"
                            getAriaValueText={(value) => `${value} Grad`}
                            sx={{ mx: 1 }}
                        />
                    </Row>
                    {selected.width !== null && (
                        <Box sx={rowSx}>
                            <Button
                                startIcon={<WrapTextIcon />}
                                size="small"
                                fullWidth
                                sx={{ bgcolor: 'background.paper', color: 'text.primary' }}
                                onClick={() => onChange({ ...selected, width: null })}
                            >
                                Automatisch umbrechen
                            </Button>
                        </Box>
                    )}
                    <Box sx={twoColumnsSx}>
                        <Button
                            startIcon={<BookmarkAddIcon />}
                            sx={actionButtonSx}
                            disabled={savingPreset || !selected.text.trim()}
                            onClick={() => onSavePreset(selected)}
                        >
                            Als Vorlage speichern
                        </Button>
                        <Button
                            startIcon={<DeleteIcon />}
                            sx={actionButtonSx}
                            onClick={() => onDelete(selected.id)}
                        >
                            Text löschen
                        </Button>
                    </Box>
                </Box>
            )}

            <DeletePresetDialog
                preset={presetToDelete}
                onCancel={() => setPresetToDelete(null)}
                onConfirm={(preset) => {
                    setPresetToDelete(null);
                    onDeletePreset(preset);
                }}
            />
        </Box>
    );
};

export default TextToolbar;
