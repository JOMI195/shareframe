import { KeyboardEvent } from 'react';

// Enter and Space activate an element that acts as a button without being one.
export const onActivateKey = (event: KeyboardEvent, activate: () => void) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate();
};
