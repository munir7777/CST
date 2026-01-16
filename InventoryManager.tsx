
import React, { useState, FormEvent, useMemo } from 'react';
import type { InventoryData, StockType, DeliveryRecord } from './types';
import { DatePicker } from './components/DatePicker';
import { ArrowUpIcon, ArrowDownIcon, DeleteIcon } from './components/Icons';
import { ConfirmationModal } from './components/ConfirmationModal';

interface InventoryManagerProps {
    inventory: InventoryData;
    shopOptions: string[];
    onAddDelivery: (shopName: string, quantity: number, date: string, stockType: StockType) => void;
    onDeleteDelivery: (shopName: string, deliveryId: string) => void;
    stockTypes: StockType[];
}

const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const initialDeliveryState = {
    shopName: '',
    quantity: '',
    date: getLocalDate(),
    stockType: 'DANGOTE' as StockType,
};

const ChevronIcon: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 text-slate-400 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

type SortKey = 'date' | 'stockType' | 'quantity';
type SortDirection = 'ascending' | 'descending';

const SortButton: React.FC<{
    sortKey: SortKey,
    sortConfig: { key: SortKey; direction: SortDirection };
    requestSort: (key: SortKey) => void;
    children: React.ReactNode;
    className?: string;
}> = ({ sortKey, sortConfig, requestSort, children, className }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
        <button onClick={() => requestSort(sortKey)} className={`flex items-center gap-1 ${className}`}>
            <span>{children}</span>
            {isSorted && (
                sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
            )}
        </button>
    );
};

const DeliveryHistoryTable: React.FC<{
    deliveries: DeliveryRecord[],
    stockTypes: StockType[],
    shopName: string,
    onDelete: (delivery: DeliveryRecord) => void,
}> = ({ deliveries, stockTypes, shopName, onDelete }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'descending' });
    const [filterType, setFilterType] = useState<StockType | 'All'>('All');

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const processedDeliveries = useMemo(() => {
        let items = [...deliveries];
        if (filterType !== 'All') {
            items = items.filter(d => d.stockType === filterType);
        }
        items.sort((a, b) => {
            if (sortConfig.key === 'date') {
                const valA = new Date(a.date).getTime();
                const valB = new Date(b.date).getTime();
                return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
            }
            if (sortConfig.key === 'quantity') {
                return sortConfig.direction === 'ascending' ? a.quantity - b.quantity : b.quantity - a.quantity;
            }
            // stockType
            return sortConfig.direction === 'ascending' 
                ? a.stockType.localeCompare(b.stockType) 
                : b.stockType.localeCompare(a.stockType);
        });
        return items;
    }, [deliveries, filterType, sortConfig]);

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 p-2 mb-2 bg-slate-800/50 rounded-md">
                <div className="flex items-center gap-2">
                    <label htmlFor={`filter-stockType-${shopName}`} className="text-sm font-medium text-slate-300">Filter:</label>
                    <select id={`filter-stockType-${shopName}`} value={filterType} onChange={e => setFilterType(e.target.value as StockType | 'All')} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                        <option value="All">All Types</option>
                        {stockTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <caption className="text-sm font-medium text-slate-400">Delivery History for {shopName}</caption>
            </div>
            <table className="min-w-full">
                <thead className="bg-slate-700">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                            <SortButton sortKey="date" sortConfig={sortConfig} requestSort={requestSort}>Date</SortButton>
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                            <SortButton sortKey="stockType" sortConfig={sortConfig} requestSort={requestSort}>Type</SortButton>
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase">
                            <SortButton sortKey="quantity" sortConfig={sortConfig} requestSort={requestSort} className="ml-auto">Quantity</SortButton>
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {processedDeliveries.map((delivery) => (
                        <tr key={delivery.id}>
                            <td className="px-3 py-2 text-sm text-slate-300">{formatDate(delivery.date)}</td>
                            <td className="px-3 py-2 text-sm text-indigo-400">{delivery.stockType}</td>
                            <td className="px-3 py-2 text-sm text-slate-300 text-right font-mono">{delivery.quantity} bags</td>
                             <td className="px-3 py-2 text-sm text-center">
                                <button onClick={() => onDelete(delivery)} className="text-red-500 hover:text-red-400 p-1" title="Delete delivery">
                                    <DeleteIcon className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, shopOptions, onAddDelivery, onDeleteDelivery, stockTypes }) => {
    const [deliveryData, setDeliveryData] = useState(initialDeliveryState);
    const [expandedShop, setExpandedShop] = useState<string | null>(null);
    const [deliveryToDelete, setDeliveryToDelete] = useState<{shopName: string, delivery: DeliveryRecord} | null>(null);
    
    const handleToggleExpand = (shopName: string) => {
        setExpandedShop(prev => (prev === shopName ? null : shopName));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDeliveryData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const quantity = parseInt(deliveryData.quantity, 10);
        if (!deliveryData.shopName || !quantity || quantity <= 0) {
            alert('Please select a shop and enter a valid quantity.');
            return;
        }
        onAddDelivery(deliveryData.shopName, quantity, deliveryData.date, deliveryData.stockType);
        setDeliveryData(initialDeliveryState);
    };

    const handleOpenDeleteModal = (shopName: string, delivery: DeliveryRecord) => {
        setDeliveryToDelete({ shopName, delivery });
    };

    const handleCloseDeleteModal = () => {
        setDeliveryToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (deliveryToDelete) {
            onDeleteDelivery(deliveryToDelete.shopName, deliveryToDelete.delivery.id);
            setDeliveryToDelete(null);
        }
    };

    return (
        <div>
            {/* Add Delivery Form */}
            <form onSubmit={handleSubmit} className="mb-6 pb-6 border-b border-slate-700 space-y-3">
                <h3 className="text-lg font-medium text-slate-200">Add New Delivery</h3>
                 <DatePicker
                    label="Date"
                    value={deliveryData.date}
                    onChange={(date) => setDeliveryData(prev => ({ ...prev, date }))}
                />
                <div>
                    <label htmlFor="delivery-shopName" className="block text-sm font-medium text-slate-300">Shop</label>
                    <select
                        id="delivery-shopName"
                        name="shopName"
                        value={deliveryData.shopName}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        <option value="" disabled>Select a shop</option>
                        {shopOptions.map(shop => <option key={shop} value={shop}>{shop}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="delivery-stockType" className="block text-sm font-medium text-slate-300">Stock Type</label>
                    <select
                        id="delivery-stockType"
                        name="stockType"
                        value={deliveryData.stockType}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        {stockTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="delivery-quantity" className="block text-sm font-medium text-slate-300">Quantity (Bags)</label>
                    <input
                        type="number"
                        id="delivery-quantity"
                        name="quantity"
                        value={deliveryData.quantity}
                        onChange={handleChange}
                        required
                        min="1"
                        placeholder="e.g., 600"
                        className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 text-slate-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500"
                >
                    Add Delivery
                </button>
            </form>

            {/* Inventory Table */}
            <h3 className="text-lg font-medium text-slate-200 mb-2">Current Stock Levels</h3>
             <div className="overflow-x-auto max-h-96">
                <table className="min-w-full bg-slate-800">
                    <thead className="bg-slate-700/50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Shop</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Dangote Stock</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ashaka Stock</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">History</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {shopOptions.map(shopName => {
                            const shopData = inventory[shopName];
                            const isExpanded = expandedShop === shopName;

                            return (
                                <React.Fragment key={shopName}>
                                    <tr onClick={() => handleToggleExpand(shopName)} className="cursor-pointer hover:bg-slate-700/50">
                                        <td className="px-4 py-2 text-sm font-medium text-slate-200">{shopName}</td>
                                        <td className="px-4 py-2 text-sm text-slate-300 text-right font-mono">{shopData?.currentStock?.DANGOTE || 0}</td>
                                        <td className="px-4 py-2 text-sm text-slate-300 text-right font-mono">{shopData?.currentStock?.ASHAKA || 0}</td>
                                        <td className="px-4 py-2 text-center">
                                            <ChevronIcon isExpanded={isExpanded} />
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={4} className="p-0 bg-slate-900">
                                                <div className="p-3">
                                                {(shopData?.deliveries?.length || 0) > 0 ? (
                                                    <DeliveryHistoryTable 
                                                        deliveries={shopData.deliveries} 
                                                        stockTypes={stockTypes} 
                                                        shopName={shopName}
                                                        onDelete={(delivery) => handleOpenDeleteModal(shopName, delivery)}
                                                    />
                                                ) : (
                                                    <p className="text-center text-sm text-slate-500 py-2">No delivery history for this shop.</p>
                                                )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={!!deliveryToDelete}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Delete Delivery Record"
            >
                Are you sure you want to delete this delivery?
                <br />
                Shop: <strong>{deliveryToDelete?.shopName}</strong>
                <br />
                Date: <strong>{formatDate(deliveryToDelete?.delivery.date ?? '')}</strong>
                <br />
                Type: <strong>{deliveryToDelete?.delivery.stockType}</strong>
                <br />
                Quantity: <strong>{deliveryToDelete?.delivery.quantity} bags</strong>
                <br /><br />
                This action cannot be undone and will update the current stock level.
            </ConfirmationModal>
        </div>
    );
};
