import React, { useState, useMemo } from 'react';
import { SaleRecord, InventoryData, StockType, DeliveryRecord } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DashboardPage } from './pages/DashboardPage';
import { AddSalePage } from './pages/AddSalePage';
import { InventoryPage } from './pages/InventoryPage';

const shopOptions = Array.from({ length: 10 }, (_, i) => `Shop ${i + 1}`);
const stockTypes: StockType[] = ['DANGOTE', 'ASHAKA'];

const initialInventory: InventoryData = shopOptions.reduce((acc, shopName) => {
  acc[shopName] = { currentStock: { DANGOTE: 0, ASHAKA: 0 }, deliveries: [] };
  return acc;
}, {} as InventoryData);


const App: React.FC = () => {
  const [sales, setSales] = useLocalStorage<SaleRecord[]>('salesData', []);
  const [inventory, setInventory] = useLocalStorage<InventoryData>('inventoryData', initialInventory);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'addSale' | 'editSale' | 'inventory'>('dashboard');

  const handleNavigate = (view: 'dashboard' | 'addSale' | 'inventory') => {
    setCurrentView(view);
  };

  const handleAddSale = (data: SaleRecord) => {
    const stock = inventory[data.shopName]?.currentStock[data.stockType] || 0;
    if (data.bagsSold > stock) {
      alert(`Error: Not enough ${data.stockType} stock. Only ${stock} bags available at ${data.shopName}.`);
      return;
    }

    const expectedRevenue = data.bagsSold * data.pricePerBag;
    const discrepancy = expectedRevenue - (data.totalTransfer + data.expenses);

    const newSale: SaleRecord = {
      id: new Date().toISOString() + Math.random(),
      date: data.date,
      shopName: data.shopName,
      stockType: data.stockType,
      bagsSold: data.bagsSold,
      pricePerBag: data.pricePerBag,
      totalTransfer: data.totalTransfer,
      expenses: data.expenses,
      notes: data.notes,
      expectedRevenue,
      discrepancy,
    };
    
    setSales(prevSales => [newSale, ...prevSales]);
    setInventory(prevInv => ({
      ...prevInv,
      [data.shopName]: {
        ...prevInv[data.shopName],
        currentStock: {
          ...prevInv[data.shopName].currentStock,
          [data.stockType]: prevInv[data.shopName].currentStock[data.stockType] - data.bagsSold,
        }
      }
    }));
    setCurrentView('dashboard');
  };

  const handleUpdateSale = (saleData: SaleRecord) => {
    const originalSale = sales.find(s => s.id === saleData.id);
    if (!originalSale) return;

    // Create a temporary inventory state as if the original sale never happened
    const tempInventory = JSON.parse(JSON.stringify(inventory));
    tempInventory[originalSale.shopName].currentStock[originalSale.stockType] += originalSale.bagsSold;

    // Check if the new/edited sale is possible from this temporary state
    if (saleData.bagsSold > tempInventory[saleData.shopName].currentStock[saleData.stockType]) {
        alert(`Error: Not enough ${saleData.stockType} stock to make this change. Only ${tempInventory[saleData.shopName].currentStock[saleData.stockType]} bags available.`);
        return;
    }

    // If possible, calculate the final sale object
    const expectedRevenue = saleData.bagsSold * saleData.pricePerBag;
    // FIX: In `handleUpdateSale`, `data` was used instead of `saleData` when calculating discrepancy. Corrected to use `saleData.expenses`.
    const discrepancy = expectedRevenue - (saleData.totalTransfer + saleData.expenses);
    const finalSale: SaleRecord = { ...saleData, expectedRevenue, discrepancy };

    // Update sales state
    setSales(prevSales => prevSales.map(s => s.id === finalSale.id ? finalSale : s));
    
    // Update inventory state based on the change
    setInventory(prevInv => {
        const newInv = JSON.parse(JSON.stringify(prevInv));
        // Revert the stock from the original sale
        newInv[originalSale.shopName].currentStock[originalSale.stockType] += originalSale.bagsSold;
        // Apply the stock change for the new/updated sale
        newInv[finalSale.shopName].currentStock[finalSale.stockType] -= finalSale.bagsSold;
        return newInv;
    });

    setEditingSale(null);
    setCurrentView('dashboard');
  };

  const handleDeleteSale = (saleToDelete: SaleRecord) => {
    setInventory(prevInv => {
      const shopInventory = prevInv[saleToDelete.shopName];
      if (!shopInventory) {
        console.warn(`Inventory for shop "${saleToDelete.shopName}" not found. Cannot return stock.`);
        return prevInv;
      }
      return {
        ...prevInv,
        [saleToDelete.shopName]: {
          ...shopInventory,
          currentStock: {
            ...shopInventory.currentStock,
            [saleToDelete.stockType]: shopInventory.currentStock[saleToDelete.stockType] + saleToDelete.bagsSold,
          }
        }
      };
    });
    setSales(prevSales => prevSales.filter(sale => sale.id !== saleToDelete.id));
  };
  
  const handleAddDelivery = (shopName: string, quantity: number, date: string, stockType: StockType) => {
    setInventory(prevInv => {
      const shopData = prevInv[shopName];
      const newDelivery: DeliveryRecord = {
        id: new Date().toISOString() + Math.random(),
        date,
        quantity,
        stockType,
      };
      return {
        ...prevInv,
        [shopName]: {
          ...shopData,
          currentStock: {
            ...shopData.currentStock,
            [stockType]: shopData.currentStock[stockType] + quantity,
          },
          deliveries: [...shopData.deliveries, newDelivery]
        }
      }
    });
  };

  const handleDeleteDelivery = (shopName: string, deliveryId: string) => {
    setInventory(prevInv => {
      const shopInventory = prevInv[shopName];
      if (!shopInventory) return prevInv;

      const deliveryToDelete = shopInventory.deliveries.find(d => d.id === deliveryId);
      if (!deliveryToDelete) return prevInv;

      // Safety check: prevent deletion if it results in negative stock
      if (shopInventory.currentStock[deliveryToDelete.stockType] < deliveryToDelete.quantity) {
        alert(`Cannot delete this delivery. Deleting it would result in negative stock due to subsequent sales.\nPlease adjust or delete sales records for ${deliveryToDelete.stockType} at ${shopName} first.`);
        return prevInv;
      }

      const updatedDeliveries = shopInventory.deliveries.filter(d => d.id !== deliveryId);
      const updatedStock = shopInventory.currentStock[deliveryToDelete.stockType] - deliveryToDelete.quantity;

      return {
        ...prevInv,
        [shopName]: {
          ...shopInventory,
          currentStock: {
            ...shopInventory.currentStock,
            [deliveryToDelete.stockType]: updatedStock,
          },
          deliveries: updatedDeliveries,
        }
      };
    });
  };

  const handleEditSale = (sale: SaleRecord) => { 
    setEditingSale(sale);
    setCurrentView('editSale');
  };
  const handleCancelEdit = () => { 
    setEditingSale(null);
    setCurrentView('dashboard');
  };

  const summaryData = useMemo(() => {
    const totalBagsSold = sales.reduce((sum, s) => sum + s.bagsSold, 0);
    const totalRevenue = sales.reduce((sum, s) => sum + s.expectedRevenue, 0);
    const totalTransferred = sales.reduce((sum, s) => sum + s.totalTransfer, 0);
    const totalDiscrepancy = sales.reduce((sum, s) => sum + s.discrepancy, 0);
    return { totalBagsSold, totalRevenue, totalTransferred, totalDiscrepancy };
  }, [sales]);

  const renderContent = () => {
    switch (currentView) {
      case 'addSale':
      case 'editSale':
        return (
          <AddSalePage
            onSubmit={currentView === 'editSale' ? handleUpdateSale : handleAddSale}
            onCancel={handleCancelEdit}
            editingSale={editingSale}
            inventory={inventory}
            shopOptions={shopOptions}
            stockTypes={stockTypes}
          />
        );
      case 'inventory':
        return (
          <InventoryPage
            inventory={inventory}
            shopOptions={shopOptions}
            onAddDelivery={handleAddDelivery}
            onDeleteDelivery={handleDeleteDelivery}
            onNavigateBack={() => handleNavigate('dashboard')}
            stockTypes={stockTypes}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardPage
            sales={sales}
            summaryData={summaryData}
            shopOptions={shopOptions}
            onEditSale={handleEditSale}
            onDeleteSale={handleDeleteSale}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
      <header className="bg-slate-800/50 backdrop-blur-sm shadow-lg border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-600" title="Cement Sales Tracker">
              <span className="text-yellow-400 font-bold text-lg">CST</span>
            </div>
            <h1 className="text-xl font-bold text-slate-50 tracking-tight">
              Cement Sales Tracker
            </h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 animate-fade-in">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
