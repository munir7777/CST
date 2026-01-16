
import React, { useState, useMemo } from 'react';
import { SalesTable } from '../components/SalesTable';
import { ShopPerformance } from '../components/ShopPerformance';
import { DatePicker } from '../components/DatePicker';
import { ConfirmationModal } from '../components/ConfirmationModal';
import type { SaleRecord } from '../types';
import { ExportIcon, PlusIcon, ArchiveIcon, FilterIcon } from '../components/Icons';

declare var XLSX: any;

interface SummaryData {
    totalBagsSold: number;
    totalRevenue: number;
    totalTransferred: number;
    totalDiscrepancy: number;
}

interface DashboardPageProps {
    sales: SaleRecord[];
    summaryData: SummaryData;
    shopOptions: string[];
    onEditSale: (sale: SaleRecord) => void;
    onDeleteSale: (sale: SaleRecord) => void;
    onNavigate: (view: 'addSale' | 'inventory') => void;
}

const SummaryCard: React.FC<{ title: string; value: string | number; colorClass?: string; isCurrency?: boolean }> = ({ title, value, colorClass = 'text-slate-200', isCurrency = false }) => (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg flex-1 text-center">
      <h3 className="text-sm font-medium text-slate-400">{title}</h3>
      <p className={`text-2xl font-bold ${colorClass}`}>
        {isCurrency ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(value)) : value}
      </p>
    </div>
);
  
export const DashboardPage: React.FC<DashboardPageProps> = ({
    sales,
    summaryData,
    shopOptions,
    onEditSale,
    onDeleteSale,
    onNavigate,
}) => {
    const [filters, setFilters] = useState({
        shopName: '',
        startDate: '',
        endDate: '',
    });
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState<SaleRecord | null>(null);


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name: 'startDate' | 'endDate', date: string) => {
        setFilters(prev => ({...prev, [name]: date}));
    };

    const handleClearFilters = () => {
        setFilters({ shopName: '', startDate: '', endDate: '' });
    };

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const shopMatch = filters.shopName ? sale.shopName.toLowerCase().includes(filters.shopName.toLowerCase()) : true;
            const startDateMatch = filters.startDate ? sale.date >= filters.startDate : true;
            const endDateMatch = filters.endDate ? sale.date <= filters.endDate : true;
            return shopMatch && startDateMatch && endDateMatch;
        });
    }, [sales, filters]);

    const handleExportToExcel = () => {
        if (filteredSales.length === 0) {
          alert("No data available for the current filters to export.");
          return;
        }
    
        const header = [
            'Date', 'Shop Name', 'Stock Type', 'Bags Sold', 
            'Price per Bag (NGN)', 'Expected Revenue (NGN)', 'Amount Transferred (NGN)', 'Expenses (NGN)', 
            'Notes', 'Discrepancy (NGN)'
        ];
        const currencyColumns = [4, 5, 6, 7, 9];
        const notesColumn = 8;
        const dateColumn = 0;
    
        const dataToExport = filteredSales.map(sale => ([
            new Date(sale.date + 'T00:00:00'),
            sale.shopName,
            sale.stockType,
            sale.bagsSold,
            sale.pricePerBag,
            sale.expectedRevenue,
            sale.totalTransfer,
            sale.expenses,
            sale.notes ?? '',
            sale.discrepancy,
        ])).reverse();
    
        const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataToExport]);
    
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F46E5" } }, // Indigo-600
            alignment: { horizontal: "center", vertical: "center" }
        };
        const oddRowStyle = { fill: { fgColor: { rgb: "FFFFFF" } } }; // White
        const evenRowStyle = { fill: { fgColor: { rgb: "F1F5F9" } } }; // slate-100
    
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                let cell = worksheet[cell_ref];
                if (!cell) continue;
    
                if (R === 0) {
                    cell.s = headerStyle;
                } else {
                    cell.s = (R % 2 === 0) ? evenRowStyle : oddRowStyle;
                    
                    if (C === dateColumn) {
                        cell.t = 'd';
                        cell.z = 'dd-mmm-yyyy';
                    } else if (currencyColumns.includes(C)) {
                        cell.t = 'n';
                        cell.z = '₦#,##0.00;[Red]-₦#,##0.00';
                    } else if (C === notesColumn && cell.v) {
                         cell.s.alignment = { wrapText: true, vertical: 'top' };
                    }
                }
            }
        }
    
        const columnWidths = header.map((h, i) => {
            const headerLength = h.length;
            const lengths = dataToExport.map(row => {
                const value = row[i];
                if (i === notesColumn && typeof value === 'string') {
                    const longestLine = Math.max(...value.split('\n').map(l => l.length));
                    return Math.min(60, longestLine);
                }
                if (i === dateColumn) return 12;
                if (currencyColumns.includes(i)) return 18;
                return String(value ?? '').length;
            });
            const maxLength = Math.max(0, ...lengths);
            return { wch: Math.max(headerLength, maxLength) + 2 };
        });
        worksheet["!cols"] = columnWidths;
        
        worksheet['!autofilter'] = { ref: worksheet['!ref'] };
        worksheet['!view'] = { freeze: { ySplit: 1 } };
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
        const today = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Sales_Report_${today}.xlsx`);
    };

    const handleOpenDeleteModal = (sale: SaleRecord) => {
        setSaleToDelete(sale);
    };

    const handleCloseDeleteModal = () => {
        setSaleToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (saleToDelete) {
            onDeleteSale(saleToDelete);
            setSaleToDelete(null);
        }
    };

    const formatDateForModal = (dateString: string | undefined) => {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    return (
        <div className="flex flex-col gap-6 md:gap-8">
            <div className="bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <h2 className="text-lg font-semibold text-slate-100 flex-shrink-0 mb-4 sm:mb-0 sm:mr-4">Actions</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                        <button onClick={() => onNavigate('addSale')} className="flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors">
                            <PlusIcon className="h-5 w-5" />
                            <span>Add New Sale</span>
                        </button>
                        <button onClick={() => onNavigate('inventory')} className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors">
                            <ArchiveIcon className="h-5 w-5" />
                            <span>Manage Inventory</span>
                        </button>
                        <div className="hidden sm:flex flex-grow"></div>
                        <button onClick={handleExportToExcel} disabled={filteredSales.length === 0} className="flex items-center justify-center gap-2 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                            <ExportIcon className="h-5 w-5" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 p-4 md:p-6 rounded-lg shadow-lg border border-slate-700">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">Sales Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard title="Total Cement Bags Sold" value={summaryData.totalBagsSold} />
                    <SummaryCard title="Total Expected Revenue" value={summaryData.totalRevenue} isCurrency />
                    <SummaryCard title="Total Transferred" value={summaryData.totalTransferred} isCurrency />
                </div>
            </div>
            
            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700">
                <div className="w-full flex justify-between items-center p-4 md:p-6 text-left">
                    <h2 className="text-xl font-semibold text-slate-100">Sales Records</h2>
                    <button 
                        onClick={() => setIsFilterVisible(!isFilterVisible)}
                        className="flex items-center gap-2 px-3 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors"
                        aria-expanded={isFilterVisible}
                        aria-controls="filters-panel"
                    >
                        <FilterIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">Filter & Search</span>
                    </button>
                </div>
                
                <div id="sales-records-content">
                    <div className="border-t border-slate-700">
                        <div id="filters-panel" className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterVisible ? 'max-h-96' : 'max-h-0'}`}>
                            <div className="p-4 md:p-6">
                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                        <div className="md:col-span-2">
                                            <label htmlFor="shopNameFilter" className="block text-sm font-medium text-slate-300 mb-1">Filter by Shop Name</label>
                                            <input
                                                type="text"
                                                id="shopNameFilter"
                                                name="shopName"
                                                value={filters.shopName}
                                                onChange={handleFilterChange}
                                                className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 text-slate-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                placeholder="Type a shop name..."
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <DatePicker label="Start Date" value={filters.startDate} onChange={(date) => handleDateChange('startDate', date)} />
                                        </div>
                                        <div className="md:col-span-1">
                                            <DatePicker label="End Date" value={filters.endDate} onChange={(date) => handleDateChange('endDate', date)} />
                                        </div>
                                        <div className="flex justify-start">
                                            <button onClick={handleClearFilters} className="w-full md:w-auto px-4 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-colors">
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 pb-4 md:px-6 md:pb-6">
                           <SalesTable sales={filteredSales} onEdit={onEditSale} onDelete={handleOpenDeleteModal} />
                        </div>
                    </div>
                </div>
            </div>
          
            <ShopPerformance sales={filteredSales} shopOptions={shopOptions} />

            <ConfirmationModal
                isOpen={!!saleToDelete}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Delete Sale Record"
            >
                Are you sure you want to delete the sale record for{' '}
                <strong>{saleToDelete?.shopName}</strong> from{' '}
                <strong>{formatDateForModal(saleToDelete?.date)}</strong>? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
};
