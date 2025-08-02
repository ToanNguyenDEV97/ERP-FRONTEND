import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';

import { AIChatMessage, Customer, InventoryItem, Order, Product, PurchaseOrder, Supplier, JournalEntry } from '../types';

interface AIChatBotProps {
    isOpen: boolean;
    onClose: () => void;
    customers: Customer[];
    products: Product[];
    orders: Order[];
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    journalEntries: JournalEntry[];
    inventoryStock: InventoryItem[];
}

const LoadingIcon = () => (
    <div className="flex items-center justify-center space-x-1">
        <div className="w-1.5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-1.5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1.5 h-1.5 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
    </div>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
    </svg>
);


const AIChatBot: React.FC<AIChatBotProps> = ({ 
    isOpen, onClose, customers, products, orders, purchaseOrders, suppliers, journalEntries, inventoryStock
}) => {
    const [messages, setMessages] = useState<AIChatMessage[]>([
        { sender: 'ai', text: 'Chào bạn, tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
        if(isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const getSystemInstruction = () => {
        // Summarize data to reduce token usage
        const totalStockByProduct = inventoryStock.reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.stock;
            return acc;
        }, {} as Record<string, number>);

        const summarizedProducts = products.map(p => ({ 
            id: p.id, 
            name: p.name, 
            stock: totalStockByProduct[p.id] || 0,
            minStock: p.minStock, 
            price: p.price, 
            cost: p.cost 
        }));
        const summarizedOrders = orders.map(o => ({ id: o.id, customerName: o.customerName, date: o.date, total: o.total, status: o.status, paymentStatus: o.paymentStatus }));
        const summarizedCustomers = customers.map(c => ({ id: c.id, name: c.name, type: c.type }));
        
        const dataContext = `
            Hôm nay là ngày ${new Date().toISOString().split('T')[0]}.
            Dữ liệu hệ thống:
            - Products: ${JSON.stringify(summarizedProducts)}
            - Orders: ${JSON.stringify(summarizedOrders)}
            - Customers: ${JSON.stringify(summarizedCustomers)}
            - Purchase Orders: ${JSON.stringify(purchaseOrders)}
            - Suppliers: ${JSON.stringify(suppliers)}
            - Journal Entries (Accounting): ${JSON.stringify(journalEntries)}
        `;

        return `You are an expert ERP assistant for a Vietnamese business. Your name is 'Trợ lý AI'.
        Your purpose is to help the user by answering questions based on the provided JSON data.
        Analyze the data context below to answer the user's question.
        Always respond in Vietnamese. Be friendly, concise, and professional.
        When providing lists of data, format them as a markdown table.
        Do not make up information that is not in the provided data. If you don't know the answer, say "Tôi không có đủ thông tin để trả lời câu hỏi này."
        
        ${dataContext}
        `;
    };

    const handleSendMessage = async (e: React.FormEvent | React.MouseEvent, messageText?: string) => {
        e.preventDefault();
        const query = (messageText || userInput).trim();
        if (!query || isLoading) return;

        setMessages(prev => [...prev, { sender: 'user', text: query }]);
        setUserInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: query,
                config: {
                    systemInstruction: getSystemInstruction()
                }
            });

            setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
        } catch (error) {
            console.error("Gemini API error:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.", isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestionChips = [
        "Sản phẩm nào sắp hết hàng?",
        "Doanh thu hôm nay là bao nhiêu?",
        "Top 5 khách hàng chi tiêu nhiều nhất?",
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50">
            <div className="ai-chat-window bg-white dark:bg-slate-800 w-full h-full sm:w-[400px] sm:h-[600px] rounded-t-xl sm:rounded-xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-2">
                         <div className="p-1.5 bg-primary-100 dark:bg-primary-900/50 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.996 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.004Zm4.243 17.58L15.22 19l-2.02-3.03c-.1-.15-.26-.25-.42-.25s-.32.1-.42.25L10.34 19l-1.018-1.42c-.24-.33-.67-.42-1.01-.21s-.58.62-.58 1.01v.01c0 .08.01.16.04.23l1.58 3.52c.26.58.82.95 1.45.95h.01c.63 0 1.19-.37 1.45-.95l1.58-3.52c.03-.07.04-.15.04-.23v-.01c0-.39-.24-.74-.58-1.01s-.77-.12-1.01.21Zm-.42-10.59L14.8 5l2.02 3.03c.1.15.26.25.42.25s.32-.1.42-.25L19.68 5l1.018 1.42c.24.33.67-.42 1.01.21s.58-.62.58-1.01v-.01c0-.08-.01-.16-.04-.23L20.64 1.87c-.26-.58-.82-.95-1.45-.95h-.01c-.63 0-1.19.37-1.45.95L16.15 5.4c-.03.07-.04.15-.04.23v.01c0 .39.24.74.58 1.01s.77.12 1.01-.21Z M5.013 10.925l-1.42-1.02a.965.965 0 0 1-.21-1.01c.21-.34.62-.58 1.01-.58h.01c.08 0 .16.01.23.04l3.52 1.58c.58.26.95.82.95 1.45v.01c0 .63-.37 1.19-.95 1.45l-3.52 1.58a.965.965 0 0 1-.23.04h-.01c-.39 0-.74-.24-1.01-.58s-.12-.77.21-1.01l1.42-1.02c.15-.1.25-.26.25-.42s-.1-.32-.25-.42Z" />
                            </svg>
                         </div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Trợ lý AI</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-3xl font-light">&times;</button>
                </div>
                
                {/* Chat Body */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && (
                                <div className="flex-shrink-0 w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.996 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.004Zm4.243 17.58L15.22 19l-2.02-3.03c-.1-.15-.26-.25-.42-.25s-.32.1-.42.25L10.34 19l-1.018-1.42c-.24-.33-.67-.42-1.01-.21s-.58.62-.58 1.01v.01c0 .08.01.16.04.23l1.58 3.52c.26.58.82.95 1.45.95h.01c.63 0 1.19-.37 1.45-.95l1.58-3.52c.03-.07.04-.15.04-.23v-.01c0-.39-.24-.74-.58-1.01s-.77-.12-1.01.21Zm-.42-10.59L14.8 5l2.02 3.03c.1.15.26.25.42.25s.32-.1.42-.25L19.68 5l1.018 1.42c.24.33.67-.42 1.01.21s.58-.62.58-1.01v-.01c0-.08-.01-.16-.04-.23L20.64 1.87c-.26-.58-.82-.95-1.45-.95h-.01c-.63 0-1.19.37-1.45.95L16.15 5.4c-.03.07-.04.15-.04.23v.01c0 .39.24.74.58 1.01s.77.12 1.01-.21Z M5.013 10.925l-1.42-1.02a.965.965 0 0 1-.21-1.01c.21-.34.62-.58 1.01-.58h.01c.08 0 .16.01.23.04l3.52 1.58c.58.26.95.82.95 1.45v.01c0 .63-.37 1.19-.95 1.45l-3.52 1.58a.965.965 0 0 1-.23.04h-.01c-.39 0-.74-.24-1.01-.58s-.12-.77.21-1.01l1.42-1.02c.15-.1.25-.26.25-.42s-.1-.32-.25-.42Z" /></svg>
                                </div>
                            )}
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-br-none' : `bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none ${msg.isError ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200' : ''}`}`}>
                                 {isLoading && index === messages.length - 1 && msg.sender === 'ai' ? <LoadingIcon /> : <div className="ai-chat-response" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) as string }} />}
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex items-end gap-2 justify-start"><div className="flex-shrink-0 w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.996 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.004Zm4.243 17.58L15.22 19l-2.02-3.03c-.1-.15-.26-.25-.42-.25s-.32.1-.42.25L10.34 19l-1.018-1.42c-.24-.33-.67-.42-1.01-.21s-.58.62-.58 1.01v.01c0 .08.01.16.04.23l1.58 3.52c.26.58.82.95 1.45.95h.01c.63 0 1.19-.37 1.45-.95l1.58-3.52c.03-.07.04-.15.04-.23v-.01c0-.39-.24-.74-.58-1.01s-.77-.12-1.01.21Zm-.42-10.59L14.8 5l2.02 3.03c.1.15.26.25.42.25s.32-.1.42-.25L19.68 5l1.018 1.42c.24.33.67-.42 1.01.21s.58-.62.58-1.01v-.01c0-.08-.01-.16-.04-.23L20.64 1.87c-.26-.58-.82-.95-1.45-.95h-.01c-.63 0-1.19.37-1.45.95L16.15 5.4c-.03.07-.04.15-.04.23v.01c0 .39.24.74.58 1.01s.77.12 1.01-.21Z M5.013 10.925l-1.42-1.02a.965.965 0 0 1-.21-1.01c.21-.34.62-.58 1.01-.58h.01c.08 0 .16.01.23.04l3.52 1.58c.58.26.95.82.95 1.45v.01c0 .63-.37 1.19-.95 1.45l-3.52 1.58a.965.965 0 0 1-.23.04h-.01c-.39 0-.74-.24-1.01-.58s-.12-.77.21-1.01l1.42-1.02c.15-.1.25-.26.25-.42s-.1-.32-.25-.42Z" /></svg></div><div className="max-w-[80%] rounded-2xl px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 rounded-bl-none"><LoadingIcon /></div></div>}
                    <div ref={messagesEndRef} />
                </div>
                
                 {/* Input Area */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
                    <div className="flex gap-2 mb-2 overflow-x-auto">
                        {suggestionChips.map(chip => (
                            <button key={chip} onClick={(e) => handleSendMessage(e, chip)} className="text-xs text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/50 hover:bg-primary-200 dark:hover:bg-primary-900 rounded-full px-3 py-1.5 whitespace-nowrap" disabled={isLoading}>
                                {chip}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Nhập câu hỏi của bạn..."
                            className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-300"
                            disabled={isLoading}
                        />
                        <button type="submit" className="bg-primary-600 text-white rounded-full p-2.5 hover:bg-primary-700 disabled:bg-slate-400" disabled={isLoading || !userInput.trim()}>
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AIChatBot;