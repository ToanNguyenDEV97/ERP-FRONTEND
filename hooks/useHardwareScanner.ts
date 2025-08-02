import { useEffect, useState, useCallback } from 'react';

const SCANNER_INPUT_TIMEOUT = 50; // ms

interface UseHardwareScannerOptions {
    onScan: (code: string) => void;
    isEnabled: boolean;
}

export const useHardwareScanner = ({ onScan, isEnabled }: UseHardwareScannerOptions) => {
    const [buffer, setBuffer] = useState<string[]>([]);
    const [lastKeystroke, setLastKeystroke] = useState<number>(0);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isEnabled) return;

        // Ignore control keys, function keys, etc.
        if (e.key.length > 1 && e.key !== 'Enter') {
            return;
        }

        const now = Date.now();
        
        // If the time difference between keystrokes is too long, it's likely manual typing.
        if (now - lastKeystroke > SCANNER_INPUT_TIMEOUT) {
            setBuffer([]); // Reset buffer
        }

        if (e.key === 'Enter') {
            if (buffer.length > 2) { // Minimum length for a barcode
                const scannedCode = buffer.join('');
                onScan(scannedCode);
            }
            setBuffer([]);
        } else {
            setBuffer(prev => [...prev, e.key]);
        }
        
        setLastKeystroke(now);

    }, [isEnabled, buffer, lastKeystroke, onScan]);


    useEffect(() => {
        if (isEnabled) {
            window.addEventListener('keydown', handleKeyDown);
        } else {
            window.removeEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isEnabled, handleKeyDown]);
};
