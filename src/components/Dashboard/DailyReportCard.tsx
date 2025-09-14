import React from 'react';
import Card from '../UI/Card';
import { Building, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CompanyDailyBalance {
  companyName: string;
  todayClosingBalance: number;
  tomorrowOpeningBalance: number;
  todayCredit: number;
  todayDebit: number;
}

interface DailyReportCardProps {
  data: CompanyDailyBalance[];
  selectedDate: string;
  isLoading?: boolean;
}

const DailyReportCard: React.FC<DailyReportCardProps> = ({
  data,
  selectedDate,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className='p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
        <div className='text-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-2 text-gray-600'>Loading daily report...</p>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className='p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'>
        <div className='text-center py-8'>
          <Building className='w-12 h-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-gray-700 mb-2'>No Data Available</h3>
          <p className='text-gray-500'>No company transactions found for {format(new Date(selectedDate), 'dd MMM yyyy')}</p>
        </div>
      </Card>
    );
  }

  // Calculate totals
  const totalClosingBalance = data.reduce((sum, company) => sum + company.todayClosingBalance, 0);
  const totalOpeningBalance = data.reduce((sum, company) => sum + company.tomorrowOpeningBalance, 0);
  const totalCredit = data.reduce((sum, company) => sum + company.todayCredit, 0);
  const totalDebit = data.reduce((sum, company) => sum + company.todayDebit, 0);

  return (
    <Card className='p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Calendar className='w-6 h-6 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-blue-800'>Daily Report</h2>
            <p className='text-sm text-blue-600'>
              Company-wise balances for {format(new Date(selectedDate), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        <div className='text-right'>
          <div className='text-sm text-gray-600'>Total Companies</div>
          <div className='text-2xl font-bold text-blue-800'>{data.length}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white p-4 rounded-lg border border-blue-200'>
          <div className='flex items-center gap-2 mb-2'>
            <TrendingUp className='w-4 h-4 text-green-600' />
            <span className='text-sm font-medium text-gray-600'>Today's Credit</span>
          </div>
          <div className='text-lg font-bold text-green-600'>
            ₹{totalCredit.toLocaleString()}
          </div>
        </div>
        
        <div className='bg-white p-4 rounded-lg border border-blue-200'>
          <div className='flex items-center gap-2 mb-2'>
            <TrendingDown className='w-4 h-4 text-red-600' />
            <span className='text-sm font-medium text-gray-600'>Today's Debit</span>
          </div>
          <div className='text-lg font-bold text-red-600'>
            ₹{totalDebit.toLocaleString()}
          </div>
        </div>
        
        <div className='bg-white p-4 rounded-lg border border-blue-200'>
          <div className='flex items-center gap-2 mb-2'>
            <Building className='w-4 h-4 text-blue-600' />
            <span className='text-sm font-medium text-gray-600'>Closing Balance</span>
          </div>
          <div className={`text-lg font-bold ${
            totalClosingBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ₹{totalClosingBalance.toLocaleString()}
          </div>
        </div>
        
        <div className='bg-white p-4 rounded-lg border border-blue-200'>
          <div className='flex items-center gap-2 mb-2'>
            <Building className='w-4 h-4 text-indigo-600' />
            <span className='text-sm font-medium text-gray-600'>Tomorrow Opening</span>
          </div>
          <div className={`text-lg font-bold ${
            totalOpeningBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ₹{totalOpeningBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Company Balances Table */}
      <div className='bg-white rounded-lg border border-blue-200 overflow-hidden'>
        <div className='bg-blue-100 px-4 py-3 border-b border-blue-200'>
          <h3 className='font-semibold text-blue-800'>Company-wise Balances</h3>
        </div>
        
        <div className='overflow-x-auto max-h-80 overflow-y-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-gray-50 sticky top-0 z-10'>
              <tr className='border-b border-gray-200'>
                <th className='text-left py-3 px-4 font-semibold text-gray-700'>Company</th>
                <th className='text-right py-3 px-4 font-semibold text-gray-700'>Today Credit</th>
                <th className='text-right py-3 px-4 font-semibold text-gray-700'>Today Debit</th>
                <th className='text-right py-3 px-4 font-semibold text-gray-700'>Closing Balance</th>
                <th className='text-right py-3 px-4 font-semibold text-gray-700'>Tomorrow Opening</th>
              </tr>
            </thead>
            <tbody>
              {data.map((company, index) => (
                <tr
                  key={company.companyName}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}
                >
                  <td className='py-3 px-4 font-medium text-gray-900'>
                    <div className='flex items-center gap-2'>
                      <Building className='w-4 h-4 text-gray-400' />
                      {company.companyName}
                    </div>
                  </td>
                  <td className='py-3 px-4 text-right text-green-600 font-medium'>
                    ₹{company.todayCredit.toLocaleString()}
                  </td>
                  <td className='py-3 px-4 text-right text-red-600 font-medium'>
                    ₹{company.todayDebit.toLocaleString()}
                  </td>
                  <td className='py-3 px-4 text-right font-semibold'>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        company.todayClosingBalance > 0
                          ? 'bg-green-100 text-green-800'
                          : company.todayClosingBalance < 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      ₹{company.todayClosingBalance.toLocaleString()}
                    </span>
                  </td>
                  <td className='py-3 px-4 text-right font-semibold'>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        company.tomorrowOpeningBalance > 0
                          ? 'bg-blue-100 text-blue-800'
                          : company.tomorrowOpeningBalance < 0
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      ₹{company.tomorrowOpeningBalance.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer Summary */}
        <div className='bg-gray-50 px-4 py-3 border-t border-gray-200'>
          <div className='grid grid-cols-5 gap-4 text-sm'>
            <div className='font-semibold text-gray-900'>
              Total: {data.length} companies
            </div>
            <div className='text-right text-green-600 font-semibold'>
              ₹{totalCredit.toLocaleString()}
            </div>
            <div className='text-right text-red-600 font-semibold'>
              ₹{totalDebit.toLocaleString()}
            </div>
            <div className='text-right font-semibold'>
              <span
                className={`px-2 py-1 rounded-full text-sm ${
                  totalClosingBalance >= 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                ₹{totalClosingBalance.toLocaleString()}
              </span>
            </div>
            <div className='text-right font-semibold'>
              <span
                className={`px-2 py-1 rounded-full text-sm ${
                  totalOpeningBalance >= 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                ₹{totalOpeningBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DailyReportCard;
