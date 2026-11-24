import { Box, keyframes } from '@mui/material';
import { url, useSvgIds } from '../../svgIds';
import { CLOVER_LEAF } from '../art/luckyClover';

const EARS = 'M10.5 15.5C7.5 10 8.2 6 10 4.6c3.2 2 5 5.4 5.4 8.6zM29.5 15.5c3-5.5 2.3-9.5.5-10.9-3.2 2-5 5.4-5.4 8.6z';
const INNER_EARS = 'M11.4 13.6c-1.4-3-1.2-5.4-.6-6.6 1.8 1.4 2.8 3.4 3.1 5.4zM28.6 13.6c1.4-3 1.2-5.4.6-6.6-1.8 1.4-2.8 3.4-3.1 5.4z';

// Hidden most of the cycle, then rises, looks around and sinks again.
const peek = keyframes`
    0%, 70%, 94%, 100% { transform: translateY(110%) rotate(0deg); }
    76% { transform: translateY(10%) rotate(-5deg); }
    81% { transform: translateY(6%) rotate(5deg); }
    87% { transform: translateY(8%) rotate(-3deg); }
`;

const PeekingPig = () => {
    const ids = useSvgIds('skin', 'snout', 'ear', 'eye', 'leaf');
    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: 0,
                left: { xs: 24, md: 'auto' },
                right: { md: 160 },
                width: { xs: 64, sm: 80 },
                transform: 'translateY(110%)',
                transformOrigin: '50% 100%',
                animation: `${peek} 30s ease-in-out -6s infinite`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
        >
            <Box component="svg" viewBox="0 0 40 40" sx={{ display: 'block', width: '100%', overflow: 'visible' }}>
                <defs>
                    <radialGradient id={ids.skin} cx="0.42" cy="0.3" r="0.8">
                        <stop offset="0%" stopColor="#FFE1E6" />
                        <stop offset="55%" stopColor="#F7A8B8" />
                        <stop offset="100%" stopColor="#D97488" />
                    </radialGradient>
                    <radialGradient id={ids.snout} cx="0.45" cy="0.3" r="0.8">
                        <stop offset="0%" stopColor="#FFC9D4" />
                        <stop offset="100%" stopColor="#E3849A" />
                    </radialGradient>
                    <linearGradient id={ids.ear} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F49AAE" />
                        <stop offset="100%" stopColor="#E07E95" />
                    </linearGradient>
                    <radialGradient id={ids.eye} cx="0.4" cy="0.35" r="0.7">
                        <stop offset="0%" stopColor="#4A3B5C" />
                        <stop offset="100%" stopColor="#120C18" />
                    </radialGradient>
                    <radialGradient id={ids.leaf} cx="0.4" cy="0.3" r="0.8">
                        <stop offset="0%" stopColor="#B4F5C9" />
                        <stop offset="45%" stopColor="#34B864" />
                        <stop offset="100%" stopColor="#146B35" />
                    </radialGradient>
                </defs>
                <path d={EARS} fill={url(ids.ear)} />
                <path d={INNER_EARS} fill="#C9607A" opacity={0.55} />
                <ellipse cx={20} cy={25} rx={13.5} ry={12.5} fill={url(ids.skin)} />
                <path d="M13 14.6c3.6-2 10.4-2 14 0" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.2} fill="none" strokeLinecap="round" />
                <circle cx={11.6} cy={27.6} r={2.2} fill="#FF7F98" opacity={0.35} />
                <circle cx={28.4} cy={27.6} r={2.2} fill="#FF7F98" opacity={0.35} />
                <ellipse cx={15.2} cy={21.4} rx={1.7} ry={2} fill={url(ids.eye)} />
                <ellipse cx={24.8} cy={21.4} rx={1.7} ry={2} fill={url(ids.eye)} />
                <circle cx={15.8} cy={20.7} r={0.6} fill="#FFFFFF" />
                <circle cx={25.4} cy={20.7} r={0.6} fill="#FFFFFF" />
                <ellipse cx={20} cy={28.4} rx={6.2} ry={4.4} fill={url(ids.snout)} stroke="#D47188" strokeWidth={0.5} />
                <ellipse cx={18} cy={28.6} rx={1} ry={1.5} fill="#A84A63" />
                <ellipse cx={22} cy={28.6} rx={1} ry={1.5} fill="#A84A63" />
                <ellipse cx={18.6} cy={26.4} rx={2} ry={0.8} fill="#FFFFFF" opacity={0.5} />
                <path d="M16.5 34c2.2 1.4 4.8 1.4 7 0" fill="none" stroke="#B85570" strokeWidth={0.7} strokeLinecap="round" />
                <path d="M23 34.2c2.6.2 5-1 6.8-3.2" fill="none" stroke="#1F7A3E" strokeWidth={0.7} strokeLinecap="round" />
                <g transform="translate(31 29.4) scale(0.42) translate(-12 -10.5)">
                    {[0, 90, 180, 270].map((angle) => (
                        <path key={angle} d={CLOVER_LEAF} fill={url(ids.leaf)} transform={`rotate(${angle} 12 10.5)`} />
                    ))}
                </g>
            </Box>
        </Box>
    );
};

export default PeekingPig;
