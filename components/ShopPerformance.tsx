
import React, { useMemo } from 'react';
import type { SaleRecord } from '../types';

interface ShopPerformanceProps {
  sales: SaleRecord[];
  shopOptions: string[];
}

const CurrencyDisplay: React.FC<{ value: number }> = ({ value }) => (
    <>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)}</>
);

const DiscrepancyDisplay: React.FC<{ value: number }> = ({ value }) => {
    let colorClass = 'text-slate-400';
    if (value < 0) colorClass = 'text-red-400 font-semibold';
    if (value > 0) colorClass = 'text-amber-400 font-semibold';
  
    return (
        <span className={colorClass}>
            {value !== 0 ? <CurrencyDisplay value={value} /> : '-'}
        </span>
    );
};


export const ShopPerformance: React.FC<ShopPerformanceProps> = ({ sales, shopOptions }) => {
    
    const performanceData = useMemo(() => {
        return shopOptions.map(shopName => {
            const shopSales = sales.filter(sale => sale.shopName === shopName);
            
            if (shopSales.length === 0) {
                return null;
            }

            const totalBagsSold = shopSales.reduce((sum, sale) => sum + sale.bagsSold, 0);
            const totalRevenue = shopSales.reduce((sum, sale) => sum + sale.expectedRevenue, 0);
            const totalTransferred = shopSales.reduce((sum, sale) => sum + sale.totalTransfer, 0);
            const totalExpenses = shopSales.reduce((sum, sale) => sum + sale.expenses, 0);
            const netDiscrepancy = shopSales.reduce((sum, sale) => sum + sale.discrepancy, 0);

            return {
                shopName,
                totalBagsSold,
                totalRevenue,
                totalTransferred,
                totalExpenses,
                netDiscrepancy,
            };
        }).filter((data): data is NonNullable<typeof data> => data !== null); // Filter out nulls and ensure type correctness
    }, [sales, shopOptions]);

    if (performanceData.length === 0) {
        return (
             <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                <h2 className="text-xl font-semibold mb-4 text-slate-100">Performance by Shop</h2>
                <div className="text-center py-10 px-6 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400">No sales data available to show performance.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Performance by Shop</h2>
            <div className="overflow-x-auto max-h-64">
                <table className="min-w-full bg-slate-800 divide-y divide-slate-700">
                    <thead className="bg-slate-700 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Shop</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Bags Sold</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Total Transferred</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Total Expenses</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Discrepancy</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {performanceData.map(shop => (
                            <tr key={shop.shopName} className="hover:bg-slate-700/50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-200">{shop.shopName}</td>
                                <td className="px-4 py-3 text-sm text-slate-300 text-right">{shop.totalBagsSold}</td>
                                <td className="px-4 py-3 text-sm text-slate-300 text-right"><CurrencyDisplay value={shop.totalRevenue} /></td>
                                <td className="px-4 py-3 text-sm text-slate-300 text-right"><CurrencyDisplay value={shop.totalTransferred} /></td>
                                <td className="px-4 py-3 text-sm text-slate-300 text-right"><CurrencyDisplay value={shop.totalExpenses} /></td>
                                <td className="px-4 py-3 text-sm text-right"><DiscrepancyDisplay value={shop.netDiscrepancy} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
