import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (isOpen) {
            const scanner = new Html5QrcodeScanner(
                'qr-reader',
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
                },
                false // verbose
            );

            const success = (decodedText: string) => {
                onScanSuccess(decodedText);
                onCloseAndStop();
            };
            
            const error = (errorMessage: string) => {
                // handle scan error, optional.
            };

            scanner.render(success, error);
            scannerRef.current = scanner;
        }

        return () => {
            onCloseAndStop();
        };
    }, [isOpen]);

    const onCloseAndStop = () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.getState() !== 2 /* NOT_STARTED */) {
                   scannerRef.current.clear();
                }
            } catch (error) {
                console.error("Failed to clear scanner:", error);
            } finally {
                scannerRef.current = null;
                onClose();
            }
        } else {
             onClose();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4 modal-content-container">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md modal-content">
                <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Quét mã vạch sản phẩm</h3>
                    <button onClick={onCloseAndStop} className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-3xl font-light">&times;</button>
                </div>
                <div className="p-4">
                    <div id="qr-reader" style={{ width: '100%' }}></div>
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">Hướng camera về phía mã vạch hoặc QR code.</p>
                </div>
                <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-right">
                    <button onClick={onCloseAndStop} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;
