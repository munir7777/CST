import React, { useState, useEffect } from 'react';
import { SalesForm } from './SalesForm';
import { InventoryManager } from '../InventoryManager';
import { Accordion } from './Accordion';
import { CloseIcon } from './Icons';
// FIX: Import StockType to use in the updated props interface.
import type { SaleRecord, InventoryData, StockType } from '../types';

// FIX: Update props to include missing properties required by child components SalesForm and InventoryManager.
interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    editingSale: SaleRecord | null;
    onCancelEdit: () => void;
    onAddSale: (data: SaleRecord) => void;
    onUpdateSale: (data: SaleRecord) => void;
    inventory: InventoryData;
    shopOptions: string[];
    onAddDelivery: (shopName: string, quantity: number, date: string, stockType: StockType) => void;
    onDeleteDelivery: (shopName: string, deliveryId: string) => void;
    stockTypes: StockType[];
}

export const SideMenu: React.FC<SideMenuProps> = ({
    isOpen,
    onClose,
    editingSale,
    onCancelEdit,
    onAddSale,
    onUpdateSale,
    inventory,
    shopOptions,
    onAddDelivery,
    // FIX: Destructure the new props to be passed down.
    onDeleteDelivery,
    stockTypes,
}) => {
    const [isSalesFormOpen, setIsSalesFormOpen] = useState(false);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    useEffect(() => {
        if (editingSale) {
            setIsSalesFormOpen(true);
        } else {
            // Optional: close the accordion when edit is cancelled or done
            // setIsSalesFormOpen(false);
        }
    }, [editingSale]);
    
    // Close menu on escape key press
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 z-20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            
            {/* Side Menu Panel */}
            <div
                className={`fixed top-0 left-0 h-full w-full max-w-md bg-slate-800 shadow-xl z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-100">Menu</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white"
                        aria-label="Close menu"
                    >
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                    <Accordion
                        title={editingSale ? 'Edit Sale' : 'Add New Sale'}
                        isOpen={isSalesFormOpen}
                        onToggle={() => setIsSalesFormOpen(!isSalesFormOpen)}
                    >
                        <SalesForm
                            onSubmit={editingSale ? onUpdateSale : onAddSale}
                            onCancelEdit={onCancelEdit}
                            editingSale={editingSale}
                            inventory={inventory}
                            shopOptions={shopOptions}
                            // FIX: Pass the missing 'stockTypes' prop to the SalesForm component.
                            stockTypes={stockTypes}
                        />
                    </Accordion>
                    
                    <Accordion
                        title="Inventory Management"
                        isOpen={isInventoryOpen}
                        onToggle={() => setIsInventoryOpen(!isInventoryOpen)}
                    >
                        <InventoryManager
                            inventory={inventory}
                            shopOptions={shopOptions}
                            onAddDelivery={onAddDelivery}
                            // FIX: Pass the missing 'onDeleteDelivery' and 'stockTypes' props to the InventoryManager component.
                            onDeleteDelivery={onDeleteDelivery}
                            stockTypes={stockTypes}
                        />
                    </Accordion>
                </div>
            </div>
        </>
    );
};