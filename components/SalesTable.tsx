
import React, { useState } from 'react';
import type { SaleRecord } from '../types';
import { EditIcon, DeleteIcon, DocumentTextIcon, ChevronDownIcon } from './Icons';

interface SalesTableProps {
  sales: SaleRecord[];
  onEdit: (sale: SaleRecord) => void;
  onDelete: (sale: SaleRecord) => void;
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

const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onEdit, onDelete }) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleToggleRow = (saleId: string) => {
    setExpandedRowId(currentId => (currentId === saleId ? null : saleId));
  };

  if (sales.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-slate-800/50 rounded-lg">
        <p className="text-slate-400">No sales records yet.</p>
        <p className="text-sm text-slate-500 mt-1">Add a new sale using the form to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-96">
      <table className="min-w-full bg-slate-800 divide-y divide-slate-700">
        <thead className="bg-slate-700/50 sticky top-0 z-10">
          <tr>
            <th scope="col" className="w-12 px-4 py-3 text-left"></th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Details</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Bags Sold</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Expected Revenue</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Discrepancy</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {sales.map(sale => {
            const isExpanded = expandedRowId === sale.id;
            return (
              <React.Fragment key={sale.id}>
                <tr className="hover:bg-slate-700/50 cursor-pointer" onClick={() => handleToggleRow(sale.id)}>
                  <td className="px-4 py-3 text-center">
                    <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </td>
                  <td className="px-4 py-3 align-top whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-200">{sale.shopName}</div>
                    <div className="text-xs text-slate-400">{formatDate(sale.date)}</div>
                    <div className="text-xs text-indigo-400 font-semibold">{sale.stockType}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 text-right align-top">{sale.bagsSold}</td>
                  <td className="px-4 py-3 text-sm text-slate-300 text-right"><CurrencyDisplay value={sale.expectedRevenue} /></td>
                  <td className="px-4 py-3 text-sm text-right"><DiscrepancyDisplay value={sale.discrepancy} /></td>
                  <td className="px-4 py-3 text-sm text-right whitespace-nowrap align-top">
                     <button onClick={(e) => { e.stopPropagation(); onEdit(sale); }} className="text-indigo-400 hover:text-indigo-300 p-1" title="Edit sale">
                        <EditIcon className="h-5 w-5" />
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); onDelete(sale); }} className="text-red-500 hover:text-red-400 ml-2 p-1" title="Delete sale">
                        <DeleteIcon className="h-5 w-5" />
                     </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-slate-900/50">
                    <td colSpan={6} className="p-0">
                      <div className="p-4 bg-slate-900/50">
                        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                          <div>
                            <dt className="font-medium text-slate-400">Price/Bag</dt>
                            <dd className="text-slate-300 mt-1"><CurrencyDisplay value={sale.pricePerBag} /></dd>
                          </div>
                          <div>
                            <dt className="font-medium text-slate-400">Transferred</dt>
                            <dd className="text-slate-300 mt-1"><CurrencyDisplay value={sale.totalTransfer} /></dd>
                          </div>
                          <div>
                            <dt className="font-medium text-slate-400">Expenses</dt>
                            <dd className="text-slate-300 mt-1"><CurrencyDisplay value={sale.expenses} /></dd>
                          </div>
                          {sale.notes && (
                            <div className="sm:col-span-3">
                                <dt className="font-medium text-slate-400 mb-1 flex items-center gap-2">
                                    <DocumentTextIcon className="h-4 w-4" />
                                    Notes
                                </dt>
                                <dd className="text-slate-300 text-sm p-3 bg-slate-800 rounded-md whitespace-pre-wrap max-h-40 overflow-y-auto border border-slate-700">
                                    {sale.notes}
                                </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
