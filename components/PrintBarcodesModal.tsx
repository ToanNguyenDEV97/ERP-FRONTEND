import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product } from '../types';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface PrintBarcodesModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
}

const PrintBarcodesModal: React.FC<PrintBarcodesModalProps> = ({ isOpen, onClose, products }) => {
    const [view, setView] = useState<'config' | 'preview'>('config');
    const [codeType, setCodeType] = useState<'barcode' | 'qrcode'>('barcode');
    const [quantity, setQuantity] = useState(10);
    const [showName, setShowName] = useState(true);
    const [showSku, setShowSku] = useState(false);
    const [showPrice, setShowPrice] = useState(true);
    const printContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setView('config'); // Reset to config view when modal opens
        }
    }, [isOpen]);
    
    const labelsToPrint = useMemo(() => {
        return products.flatMap(p => Array(quantity).fill(p));
    }, [products, quantity]);


    useEffect(() => {
        if (view === 'preview' || (isOpen && printContentRef.current)) {
            setTimeout(() => {
                 labelsToPrint.forEach((product, index) => {
                    const previewElement = document.getElementById(`preview-code-${index}`);
                    const printElement = document.getElementById(`print-code-${index}`);

                    const generateCode = (element: HTMLElement | null) => {
                        if (element) {
                            try {
                                if (codeType === 'barcode') {
                                    JsBarcode(element, product.sku, {
                                        format: "CODE128", displayValue: false, height: 40, margin: 5, fontSize: 12,
                                    });
                                } else {
                                    QRCode.toCanvas(element, product.sku, { width: 80, margin: 1 }, (error) => {
                                        if (error) console.error(error);
                                    });
                                }
                            } catch (e) {
                                console.error(`Failed to generate code for SKU ${product.sku}:`, e);
                            }
                        }
                    };
                    
                    if(view === 'preview') generateCode(previewElement);
                    generateCode(printElement);
                });
            }, 100); // Small delay to ensure DOM is ready
        }
    }, [view, codeType, labelsToPrint, isOpen]);

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center p-4 printable-area-container">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[95vh] no-print">
                <div className="flex justify-between items-center p-5 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">In Mã Vạch / QR Code ({products.length} sản phẩm)</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light">&times;</button>
                </div>
                
                {view === 'config' && (
                    <div className="p-5 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại mã</label>
                                <select value={codeType} onChange={e => setCodeType(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
                                    <option value="barcode">Mã vạch (Barcode)</option>
                                    <option value="qrcode">Mã QR (QR Code)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tem / mỗi sản phẩm</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10)))} min="1" className="w-full px-3 py-2 border rounded-lg"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thông tin hiển thị trên tem</label>
                            <div className="space-y-2">
                                <label className="flex items-center"><input type="checkbox" checked={showName} onChange={e => setShowName(e.target.checked)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" /> <span className="ml-2 text-sm">Tên sản phẩm</span></label>
                                <label className="flex items-center"><input type="checkbox" checked={showSku} onChange={e => setShowSku(e.target.checked)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" /> <span className="ml-2 text-sm">Mã SKU</span></label>
                                <label className="flex items-center"><input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" /> <span className="ml-2 text-sm">Giá bán</span></label>
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold">Sản phẩm đã chọn:</h4>
                            <ul className="text-sm text-gray-600 list-disc list-inside max-h-40 overflow-y-auto mt-2">
                                {products.map(p => <li key={p.id}>{p.name}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
                
                {view === 'preview' && (
                    <div className="p-5 bg-gray-100 flex-grow overflow-y-auto">
                        <p className="text-center text-sm text-gray-600 mb-4">Đây là bản xem trước. Bố cục thực tế có thể khác tùy thuộc vào máy in và khổ giấy của bạn.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {labelsToPrint.slice(0, 16).map((product, index) => ( // Show only first 16 for preview
                                <div key={index} className="barcode-label bg-white">
                                    {showName && <p className="product-name line-clamp-2">{product.name}</p>}
                                    {codeType === 'barcode' ? 
                                        <svg id={`preview-code-${index}`} className="w-full"></svg> :
                                        <canvas id={`preview-code-${index}`}></canvas>
                                    }
                                    {showSku && <p className="product-sku">{product.sku}</p>}
                                    {showPrice && product.price > 0 && <p className="product-price">{product.price.toLocaleString('vi-VN')}đ</p>}
                                </div>
                            ))}
                             {labelsToPrint.length > 16 && <div className="text-center italic text-gray-500 col-span-full py-4">... và {labelsToPrint.length - 16} tem khác.</div>}
                        </div>
                    </div>
                )}
                
                <div className="p-5 border-t bg-gray-50 flex justify-end space-x-2">
                    {view === 'config' ? (
                        <>
                             <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Hủy</button>
                             <button onClick={() => setView('preview')} className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Xem trước & In</button>
                        </>
                    ) : (
                         <>
                             <button onClick={() => setView('config')} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Quay lại</button>
                             <button onClick={handlePrint} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">In {labelsToPrint.length} tem</button>
                        </>
                    )}
                </div>
            </div>
            
             {/* This is the actual printable content, hidden from view */}
            <div className="hidden printable-area">
                 <div ref={printContentRef} className="barcode-grid">
                    {labelsToPrint.map((product, index) => (
                        <div key={`print-${index}`} className="barcode-label">
                            {showName && <p className="product-name">{product.name}</p>}
                            {codeType === 'barcode' ? 
                                <svg id={`print-code-${index}`}></svg> :
                                <canvas id={`print-code-${index}`}></canvas>
                            }
                            {showSku && <p className="product-sku">{product.sku}</p>}
                            {showPrice && product.price > 0 && <p className="product-price">{product.price.toLocaleString('vi-VN')}đ</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrintBarcodesModal;