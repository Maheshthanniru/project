import React, { useState, useEffect } from 'react';
import { , , , , , ,  } from 'lucide-react';
import Input from './Input';
import Select from './Select';
import Button from './Button';

export interface SearchFilter {
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  company: string;
  account: string;
  subAccount: string;
  staff: string;
  amountFrom: number;
  amountTo: number;
  status: string;
  type: 'credit' | 'debit' | 'both';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilter) => void;
  onClear: () => void;
  companies?: { value: string; label: string }[];
  accounts?: { value: string; label: string }[];
  subAccounts?: { value: string; label: string }[];
  staff?: { value: string; label: string }[];
  showAdvanced?: boolean;
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onClear,
  companies = [],
  accounts = [],
  subAccounts = [],
  staff = [],
  showAdvanced = false,
  className = ''
}) => {
  const [filters, setFilters] = useState<SearchFilter>({
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    company: '',
    account: '',
    subAccount: '',
    staff: '',
    amountFrom: 0,
    amountTo: 0,
    status: '',
    type: 'both'
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced);

  const handleFilterChange = (field: keyof SearchFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      company: '',
      account: '',
      subAccount: '',
      staff: '',
      amountFrom: 0,
      amountTo: 0,
      status: '',
      type: 'both'
    });
    onClear();
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => 
      value !== '' && value !== 0 && value !== 'both'
    );
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'edited', label: 'Edited' },
    { value: 'locked', label: 'Locked' }
  ];

  const typeOptions = [
    { value: 'both', label: 'Both' },
    { value: 'credit', label: 'Credit Only' },
    { value: 'debit', label: 'Debit Only' }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Basic Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search in particulars, account names, staff..."
            value={filters.searchTerm}
            onChange={(value) => handleFilterChange('searchTerm', value)}
            className="pl-10"
          />
        </div>
        <Button
          icon={}
          variant="secondary"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className={isAdvancedOpen ? 'bg-blue-100 text-blue-700' : ''}
        >
          {isAdvancedOpen ? 'Hide Filters' : 'Advanced'}
        </Button>
        <Button
          icon={}
          onClick={handleSearch}
          disabled={!hasActiveFilters()}
        >
          Search
        </Button>
        {hasActiveFilters() && (
          <Button
            icon={}
            variant="secondary"
            onClick={handleClear}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  placeholder="From Date"
                  value={filters.dateFrom}
                  onChange={(value) => handleFilterChange('dateFrom', value)}
                />
                <Input
                  type="date"
                  placeholder="To Date"
                  value={filters.dateTo}
                  onChange={(value) => handleFilterChange('dateTo', value)}
                />
              </div>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Company
              </label>
              <Select
                value={filters.company}
                onChange={(value) => handleFilterChange('company', value)}
                options={[{ value: '', label: 'All Companies' }, ...companies]}
              />
            </div>

            {/* Account */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Account</label>
              <Select
                value={filters.account}
                onChange={(value) => handleFilterChange('account', value)}
                options={[{ value: '', label: 'All Accounts' }, ...accounts]}
              />
            </div>

            {/* Sub Account */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sub Account</label>
              <Select
                value={filters.subAccount}
                onChange={(value) => handleFilterChange('subAccount', value)}
                options={[{ value: '', label: 'All Sub Accounts' }, ...subAccounts]}
              />
            </div>

            {/* Staff */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Staff
              </label>
              <Select
                value={filters.staff}
                onChange={(value) => handleFilterChange('staff', value)}
                options={[{ value: '', label: 'All Staff' }, ...staff]}
              />
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Amount Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="From Amount"
                  value={filters.amountFrom || ''}
                  onChange={(value) => handleFilterChange('amountFrom', parseFloat(value) || 0)}
                />
                <Input
                  type="number"
                  placeholder="To Amount"
                  value={filters.amountTo || ''}
                  onChange={(value) => handleFilterChange('amountTo', parseFloat(value) || 0)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                options={statusOptions}
              />
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Select
                value={filters.type}
                onChange={(value) => handleFilterChange('type', value)}
                options={typeOptions}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Quick Filters:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  handleFilterChange('dateFrom', today);
                  handleFilterChange('dateTo', today);
                }}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const yesterdayStr = yesterday.toISOString().split('T')[0];
                  handleFilterChange('dateFrom', yesterdayStr);
                  handleFilterChange('dateTo', yesterdayStr);
                }}
              >
                Yesterday
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFilterChange('status', 'pending');
                }}
              >
                Pending Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFilterChange('type', 'credit');
                }}
              >
                Credits Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFilterChange('type', 'debit');
                }}
              >
                Debits Only
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch; 