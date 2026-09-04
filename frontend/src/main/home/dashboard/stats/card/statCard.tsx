import { FC, ReactNode } from 'react';
import { Card, CardContent, Typography, Stack, Box } from "@mui/material";

interface StatCardProps {
    icon: ReactNode;
    title: string;
    value?: string | number;
    customContent?: ReactNode;
}

const StatCard: FC<StatCardProps> = ({ icon, title, value, customContent }) => {
    return (
        <Card sx={{ flexGrow: 1 }}>
            <CardContent sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start"
            }}>
                <Stack direction="row" spacing={1} sx={{
                    alignItems: "center"
                }}>
                    {icon}
                    <Box>
                        <Typography
                            variant="body2"
                            sx={{
                                color: "text.secondary",
                                mb: customContent ? 1 : 0
                            }}>
                            {title}
                        </Typography>
                        {customContent ? (
                            customContent
                        ) : (
                            <Typography variant="h6">
                                {value}
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default StatCard;