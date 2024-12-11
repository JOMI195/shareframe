import { RootState } from '@/store';
import React, { useEffect, useState, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import localStorageBuildVersionUpdate from './localStorageBuildVersionUpdateService';

interface StoreGateProps {
    children: ReactNode;
}

const StoreGate: React.FC<StoreGateProps> = ({ children }) => {
    const [isGateOpen, setIsGateOpen] = useState<boolean>(false);
    const _persist = useSelector((state: RootState) => state._persist);

    useEffect(() => {
        localStorageBuildVersionUpdate();
        setIsGateOpen(_persist.rehydrated);
    }, [_persist.rehydrated]);

    return (
        <>
            {isGateOpen ? children : null}
        </>
    );
};

export default StoreGate;
