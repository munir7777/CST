
import React, { useState, useEffect, FormEvent } from 'react';
import type { SaleRecord, InventoryData, StockType } from '../types';
import { DatePicker } from './DatePicker';

interface InputFieldProps {
  label: string;
  name: string;
  type: string;
  value: string | number;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, type, value, required = true, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-300">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      step={type === 'number' ? '0.01' : undefined}
      min={type === 'number' ? '0' : undefined}
      className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 text-slate-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      placeholder={type === 'number' ? '0' : ''}
    />
  </div>
);

interface SalesFormProps {
  onSubmit: (data: SaleRecord) => void;
  editingSale: SaleRecord | null;
  onCancelEdit: () => void;
  inventory: InventoryData;
  shopOptions: string[];
  stockTypes: StockType[];
}

const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const initialFormState = {
  date: getLocalDate(),
  shopName: '',
  stockType: 'DANGOTE' as StockType,
  bagsSold: '',
  pricePerBag: '',
  totalTransfer: '',
  expenses: '',
  notes: '',
};

export const SalesForm: React.FC<SalesFormProps> = ({ onSubmit, editingSale, onCancelEdit, inventory, shopOptions, stockTypes }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [expectedRevenue, setExpectedRevenue] = useState(0);
  const [calculatedDiscrepancy, setCalculatedDiscrepancy] = useState(0);

  useEffect(() => {
    if (editingSale) {
      setFormData({
        date: editingSale.date,
        shopName: editingSale.shopName,
        stockType: editingSale.stockType,
        bagsSold: String(editingSale.bagsSold),
        pricePerBag: String(editingSale.pricePerBag),
        totalTransfer: String(editingSale.totalTransfer),
        expenses: String(editingSale.expenses || ''),
        notes: String(editingSale.notes || ''),
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingSale]);
  
  useEffect(() => {
    const bags = parseFloat(formData.bagsSold) || 0;
    const price = parseFloat(formData.pricePerBag) || 0;
    const revenue = bags * price;
    setExpectedRevenue(revenue);

    const transfer = parseFloat(formData.totalTransfer) || 0;
    const expenses = parseFloat(formData.expenses) || 0;
    const discrepancy = revenue - (transfer + expenses);
    setCalculatedDiscrepancy(discrepancy);
  }, [formData.bagsSold, formData.pricePerBag, formData.totalTransfer, formData.expenses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.shopName === '') {
      alert('Please select a shop.');
      return;
    }

    const submissionData = {
      ...formData,
      id: editingSale?.id, // Pass id if editing
      bagsSold: parseFloat(formData.bagsSold) || 0,
      pricePerBag: parseFloat(formData.pricePerBag) || 0,
      totalTransfer: parseFloat(formData.totalTransfer) || 0,
      expenses: parseFloat(formData.expenses) || 0,
    } as unknown as SaleRecord; // Cast to SaleRecord, parent will recalculate fields
    
    onSubmit(submissionData);
    if (!editingSale) {
      setFormData(initialFormState);
    }
  };
  
  const currentStock = formData.shopName && formData.stockType
    ? (inventory[formData.shopName]?.currentStock[formData.stockType] || 0)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DatePicker
        label="Date"
        value={formData.date}
        onChange={(date) => setFormData(prev => ({ ...prev, date }))}
      />
      <div>
        <div className="flex justify-between items-baseline">
          <label htmlFor="shopName" className="block text-sm font-medium text-slate-300">
            Shop Name / ID
          </label>
          {formData.shopName && (
             <span className="text-sm text-slate-400">Stock ({formData.stockType}): {currentStock}</span>
          )}
        </div>
        <select
          id="shopName"
          name="shopName"
          value={formData.shopName}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="" disabled>Select a shop</option>
          {shopOptions.map(shop => <option key={shop} value={shop}>{shop}</option>)}
        </select>
      </div>
       <div>
        <label htmlFor="stockType" className="block text-sm font-medium text-slate-300">
            Stock Type
        </label>
        <select
            id="stockType"
            name="stockType"
            value={formData.stockType}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
            {stockTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      <InputField label="Cement Bags Sold" name="bagsSold" type="number" value={formData.bagsSold} onChange={handleChange} />
      <InputField label="Unit Price per Bag" name="pricePerBag" type="number" value={formData.pricePerBag} onChange={handleChange} />
      
      <div className="p-3 bg-slate-700/50 rounded-md border border-slate-700">
        <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">Expected Revenue:</p>
            <p className="text-lg font-bold text-indigo-400">
            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(expectedRevenue)}
            </p>
        </div>
      </div>
      
      <InputField label="Total Amount Transferred" name="totalTransfer" type="number" value={formData.totalTransfer} onChange={handleChange} />
      <InputField label="Expenses" name="expenses" type="number" value={formData.expenses} onChange={handleChange} required={false} />

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-300">
            Notes / Expense Details (Optional)
        </label>
        <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 text-slate-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Transport costs, loading fees..."
        />
      </div>

      <div className="p-3 bg-slate-900/50 rounded-md border border-slate-700 space-y-2">
        <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Deductions (Transfer + Expenses):</span>
            <span className="font-medium text-slate-200">
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format((parseFloat(formData.totalTransfer) || 0) + (parseFloat(formData.expenses) || 0))}
            </span>
        </div>
        <div className="flex justify-between text-sm">
            <span className="text-slate-400">Calculated Discrepancy:</span>
            <span className={`font-semibold ${calculatedDiscrepancy < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(calculatedDiscrepancy)}
            </span>
        </div>
      </div>


      <div className="flex items-center space-x-2 pt-2">
          <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
          >
              {editingSale ? 'Update Record' : 'Add Record'}
          </button>
          {editingSale && (
              <button
                  type="button"
                  onClick={onCancelEdit}
                  className="w-full flex justify-center py-2 px-4 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
              >
                  Cancel
              </button>
          )}
      </div>
    </form>
  );
};