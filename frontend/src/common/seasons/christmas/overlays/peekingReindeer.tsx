import { Box, keyframes } from '@mui/material';
import { url, useSvgIds } from '../svgIds';

const HEAD = 'M20 12C13 12 12 18 13 24c1 7 3 13 7 13s6-6 7-13c1-6 0-12-7-12z';
const EARS = 'M13.5 17C8 14.5 5.5 16.5 4.5 18c3 2 6.5 2 9 1zM26.5 17c5.5-2.5 8-.5 9 1-3 2-6.5 2-9 1z';
const INNER_EARS = 'M12.5 17.6c-2.8-1-5-.7-6.2.4 2 1 4.2 1.1 6.2.6zM27.5 17.6c2.8-1 5-.7 6.2.4-2 1-4.2 1.1-6.2.6z';
const ANTLERS = 'M15 13C13 8 9 7 6.5 3.5M10.5 8.5 7 9.5M8.5 5.5 9 2.5M25 13c2-5 6-6 8.5-9.5M29.5 8.5 33 9.5M31.5 5.5 31 2.5';

// Hidden most of the cycle, then rises, looks around and sinks again.
const peek = keyframes`
    0%, 70%, 94%, 100% { transform: translateY(110%) rotate(0deg); }
    76% { transform: translateY(28%) rotate(5deg); }
    81% { transform: translateY(24%) rotate(-5deg); }
    87% { transform: translateY(26%) rotate(3deg); }
`;

const glow = keyframes`
    from { opacity: 0.35; transform: scale(0.85); }
    to { opacity: 1; transform: scale(1.15); }
`;

const PeekingReindeer = () => {
    const ids = useSvgIds('fur', 'muzzle', 'antler', 'nose', 'halo', 'eye');
    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: 0,
                left: { xs: 24, md: 'auto' },
                right: { md: 160 },
                width: { xs: 60, sm: 76 },
                transform: 'translateY(110%)',
                transformOrigin: '50% 100%',
                animation: `${peek} 30s ease-in-out -18s infinite`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
        >
            <Box component="svg" viewBox="0 0 40 40" sx={{ display: 'block', width: '100%', overflow: 'visible' }}>
                <defs>
                    <linearGradient id={ids.fur} x1="0.2" y1="0" x2="0.8" y2="1">
                        <stop offset="0%" stopColor="#C08A5E" />
                        <stop offset="100%" stopColor="#6E4126" />
                    </linearGradient>
                    <radialGradient id={ids.muzzle} cx="0.5" cy="0.35" r="0.7">
                        <stop offset="0%" stopColor="#F3D9B8" />
                        <stop offset="100%" stopColor="#C9A37A" />
                    </radialGradient>
                    <linearGradient id={ids.antler} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E8CDA4" />
                        <stop offset="100%" stopColor="#9C744A" />
                    </linearGradient>
                    <radialGradient id={ids.nose} cx="0.38" cy="0.32" r="0.75">
                        <stop offset="0%" stopColor="#FFB3BE" />
                        <stop offset="40%" stopColor="#FF3B5C" />
                        <stop offset="100%" stopColor="#A3172B" />
                    </radialGradient>
                    <radialGradient id={ids.halo}>
                        <stop offset="0%" stopColor="#FF5C7A" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#FF5C7A" stopOpacity={0} />
                    </radialGradient>
                    <radialGradient id={ids.eye} cx="0.4" cy="0.35" r="0.7">
                        <stop offset="0%" stopColor="#4A3B5C" />
                        <stop offset="100%" stopColor="#120C18" />
                    </radialGradient>
                </defs>
                <path d={ANTLERS} fill="none" stroke={url(ids.antler)} strokeWidth={2.4} strokeLinecap="round" />
                <path d={EARS} fill={url(ids.fur)} />
                <path d={INNER_EARS} fill="#F2A7B2" opacity={0.7} />
                <path d={HEAD} fill={url(ids.fur)} />
                <path d="M16 13.5c1.6-.9 6.4-.9 8 0" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={1} fill="none" strokeLinecap="round" />
                <ellipse cx={20} cy={32} rx={5.6} ry={4.4} fill={url(ids.muzzle)} />
                <circle cx={15.6} cy={26} r={1.3} fill="#FF8FA0" opacity={0.45} />
                <circle cx={24.4} cy={26} r={1.3} fill="#FF8FA0" opacity={0.45} />
                <ellipse cx={16.5} cy={21.2} rx={1.9} ry={2.2} fill={url(ids.eye)} />
                <ellipse cx={23.5} cy={21.2} rx={1.9} ry={2.2} fill={url(ids.eye)} />
                <circle cx={17.1} cy={20.4} r={0.65} fill="#FFFFFF" />
                <circle cx={24.1} cy={20.4} r={0.65} fill="#FFFFFF" />
                <circle cx={16.1} cy={22.1} r={0.3} fill="#FFFFFF" opacity={0.7} />
                <circle cx={23.1} cy={22.1} r={0.3} fill="#FFFFFF" opacity={0.7} />
                <Box
                    component="circle"
                    cx={20}
                    cy={30.4}
                    r={6}
                    fill={url(ids.halo)}
                    sx={{
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        animation: `${glow} 1s ease-in-out infinite alternate`,
                        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                    }}
                />
                <circle cx={20} cy={30.4} r={2.8} fill={url(ids.nose)} />
                <ellipse cx={19} cy={29.4} rx={0.9} ry={0.6} fill="#FFFFFF" opacity={0.7} />
            </Box>
        </Box>
    );
};

export default PeekingReindeer;
