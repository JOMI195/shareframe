import { Box, keyframes } from '@mui/material';
import { INK } from '../palette';

const TICKS = [0, 90, 180, 270];

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

// Hands as degrees clockwise from 12; centred on (12, 12) with radius 9.
export const ClockFace: React.FC<{ rim: string; hour?: number; minute?: number; spinning?: boolean }> = ({ rim, hour = 0, minute = 0, spinning = false }) => (
    <>
        <circle cx={12} cy={12} r={9.6} fill={rim} />
        <circle cx={12} cy={12} r={7.8} fill="#FFFFFF" />
        {TICKS.map((angle) => (
            <path key={angle} d="M12 5.2v1.6" stroke={INK} strokeWidth={1} strokeLinecap="round" transform={`rotate(${angle} 12 12)`} />
        ))}
        <path d="M12 12V8.2" stroke={INK} strokeWidth={1.4} strokeLinecap="round" transform={`rotate(${hour} 12 12)`} />
        <g transform={`rotate(${minute} 12 12)`}>
            <Box
                component="path"
                d="M12 12V6"
                stroke={INK}
                strokeWidth={1}
                strokeLinecap="round"
                sx={
                    spinning
                        ? {
                              transformBox: 'view-box',
                              transformOrigin: '12px 12px',
                              animation: `${spin} 1.6s linear infinite`,
                              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                          }
                        : undefined
                }
            />
        </g>
        <circle cx={12} cy={12} r={0.9} fill={INK} />
    </>
);
