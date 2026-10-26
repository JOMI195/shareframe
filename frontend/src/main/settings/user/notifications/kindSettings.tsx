import { Divider, FormControlLabel, FormGroup, Switch, Typography } from '@mui/material';
import SettingsSection from '@/common/components/settings/settingsSection';
import { INotificationKindPatch, INotificationKindSettings, NotificationChannel, NotificationKind } from '@/types';

const KIND_TEXTS: Record<NotificationKind, { title: string; description: string }> = {
    inactivity_reminder: {
        title: 'Erinnerungen',
        description: 'Eine Erinnerung, wenn du drei Wochen kein Foto geteilt hast.',
    },
    changelog: {
        title: 'Neuigkeiten',
        description: 'Neuigkeiten und Änderungen an ShareFrame.',
    },
};

const CHANNEL_TEXTS: Record<NotificationChannel, { label: string; hint?: string }> = {
    push: { label: 'Push', hint: 'auf Geräten mit aktivem Push' },
    email: { label: 'E-Mail' },
};

interface KindSettingsProps {
    settings: INotificationKindSettings;
    disabled: boolean;
    onChange: (patch: INotificationKindPatch) => void;
}

const KindSettings = ({ settings, disabled, onChange }: KindSettingsProps) => {
    const { title, description } = KIND_TEXTS[settings.kind];

    return (
        <SettingsSection
            title={title}
            description={description}
            action={
                <Switch
                    checked={settings.enabled}
                    disabled={disabled}
                    onChange={(event) => onChange({ kind: settings.kind, enabled: event.target.checked })}
                    slotProps={{ input: { 'aria-label': title } }}
                />
            }
        >
            <Divider />
            <FormGroup>
                {settings.channels.map(({ channel, enabled }) => (
                    <FormControlLabel
                        key={channel}
                        control={
                            <Switch
                                size="small"
                                checked={enabled}
                                disabled={disabled || !settings.enabled}
                                onChange={(event) =>
                                    onChange({ kind: settings.kind, channels: [{ channel, enabled: event.target.checked }] })
                                }
                                slotProps={{ input: { 'aria-label': `${title} per ${CHANNEL_TEXTS[channel].label}` } }}
                            />
                        }
                        label={
                            <Typography variant="body2">
                                {CHANNEL_TEXTS[channel].label}
                                {CHANNEL_TEXTS[channel].hint && (
                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                        {CHANNEL_TEXTS[channel].hint}
                                    </Typography>
                                )}
                            </Typography>
                        }
                        sx={{ ml: 0, gap: 1 }}
                    />
                ))}
            </FormGroup>
        </SettingsSection>
    );
};

export default KindSettings;
