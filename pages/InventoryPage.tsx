
import React from 'react';
import { InventoryManager } from '../InventoryManager';
import { BackIcon } from '../components/Icons';
import type { InventoryData, StockType } from '../types';

interface InventoryPageProps {
    inventory: InventoryData;
    shopOptions: string[];
    onAddDelivery: (shopName: string, quantity: number, date: string, stockType: StockType) => void;
    onDeleteDelivery: (shopName: string, deliveryId: string) => void;
    onNavigateBack: () => void;
    stockTypes: StockType[];
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
    inventory,
    shopOptions,
    onAddDelivery,
    onDeleteDelivery,
    onNavigateBack,
    stockTypes,
}) => {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <button 
                    onClick={onNavigateBack} 
                    className="flex items-center gap-2 px-3 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-colors"
                >
                    <BackIcon className="h-5 w-5" />
                    <span>Back to Dashboard</span>
                </button>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                <h2 className="text-xl font-semibold mb-4 text-slate-100">
                    Inventory Management
                </h2>
                <InventoryManager
                    inventory={inventory}
                    shopOptions={shopOptions}
                    onAddDelivery={onAddDelivery}
                    onDeleteDelivery={onDeleteDelivery}
                    stockTypes={stockTypes}
                />
            </div>
        </div>
    );
};
