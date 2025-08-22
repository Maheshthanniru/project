import { useState, useEffect } from 'react';
import { 
  mockCompanies, 
  mockAccounts, 
  mockSubAccounts, 
  mockUsers, 
  mockVehicles,
  transactionTypes,
  yesNoOptions,
  departments
} from '../lib/mockData';

interface DropdownData {
  companies: { value: string; label: string }[];
  accounts: { value: string; label: string }[];
  subAccounts: { value: string; label: string }[];
  users: { value: string; label: string }[];
  vehicles: { value: string; label: string }[];
  departments: { value: string; label: string }[];
  transactionTypes: { value: string; label: string }[];
  yesNoOptions: { value: string; label: string }[];
}

export const useDropdownData = () => {
  const [data, setData] = useState<DropdownData>({
    companies: [],
    accounts: [],
    subAccounts: [],
    users: [],
    vehicles: [],
    departments: [],
    transactionTypes: [],
    yesNoOptions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        setData({
          companies: mockCompanies.map(item => ({
            value: item.company_name,
            label: item.company_name
          })),
          accounts: Array.from(new Set(mockAccounts.map(item => item.acc_name)))
            .map(acc => ({ value: acc, label: acc })),
          subAccounts: Array.from(new Set(mockSubAccounts.map(item => item.sub_acc)))
            .map(sub => ({ value: sub, label: sub })),
          users: mockUsers.filter(user => user.is_active).map(item => ({
            value: item.username,
            label: item.username
          })),
          vehicles: mockVehicles.map(item => ({
            value: item.v_no,
            label: item.v_no
          })),
          departments,
          transactionTypes,
          yesNoOptions});
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  const getSubAccountsByAccount = async (accountName: string, companyName: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const filteredSubAccounts = mockSubAccounts.filter(
      item => item.acc_name === accountName && item.company_name === companyName
    );

    return filteredSubAccounts.map(item => ({
      value: item.sub_acc,
      label: item.sub_acc
    }));
  };

  return { data, loading, getSubAccountsByAccount };
};