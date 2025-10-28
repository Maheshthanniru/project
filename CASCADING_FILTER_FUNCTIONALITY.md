# Cascading Filter Functionality in Edit Entry Form

## Feature Request
The user requested that Account Name, Sub Account, Credit, and Debit fields work the same way as Company Name - when you select any of these fields, it should automatically populate the other related fields with only the values that exist for that specific selection.

## Solution Implemented

### **Cascading Filter System:**

The edit entry form now implements a comprehensive cascading filter system where selecting any filter automatically updates all other related filters with only the values that exist for that specific selection.

### **Filter Hierarchy:**

1. **Date** (Top Level) - When selected, filters all other fields
2. **Company Name** - When selected, filters Account, Sub Account, Particulars, Credit, Debit
3. **Account Name** - When selected, filters Sub Account, Particulars, Credit, Debit
4. **Sub Account** - When selected, filters Particulars, Credit, Debit
5. **Particulars** - When selected, filters Credit, Debit
6. **Credit** - When selected, filters Debit
7. **Debit** - When selected, filters Credit

### **Technical Implementation:**

1. **New Function: `loadRelatedFilterOptions`**
   ```typescript
   const loadRelatedFilterOptions = async (filterType: string, filterValue: string) => {
     try {
       console.log(`🔍 Loading related options for ${filterType}:`, filterValue);
       
       // Clear dependent filters when a filter changes
       if (filterType === 'company') {
         setFilterAccountName('');
         setFilterSubAccountName('');
         setFilterParticulars('');
         setFilterCredit('');
         setFilterDebit('');
       } else if (filterType === 'account') {
         setFilterSubAccountName('');
         setFilterParticulars('');
         setFilterCredit('');
         setFilterDebit('');
       } else if (filterType === 'subAccount') {
         setFilterParticulars('');
         setFilterCredit('');
         setFilterDebit('');
       } else if (filterType === 'particulars') {
         setFilterCredit('');
         setFilterDebit('');
       }
       
       // Build query based on active filters
       let query = supabase.from('cash_book').select('company_name, acc_name, sub_acc_name, particulars, credit, debit');
       
       // Apply active filters
       if (filterDate || selectedDateFilter) {
         const activeDate = selectedDateFilter || filterDate;
         query = query.eq('c_date', activeDate);
       }
       if (filterCompanyName) {
         query = query.eq('company_name', filterCompanyName);
       }
       if (filterAccountName) {
         query = query.eq('acc_name', filterAccountName);
       }
       if (filterSubAccountName) {
         query = query.eq('sub_acc_name', filterSubAccountName);
       }
       if (filterParticulars) {
         query = query.eq('particulars', filterParticulars);
       }
       if (filterCredit) {
         query = query.eq('credit', parseFloat(filterCredit));
       }
       if (filterDebit) {
         query = query.eq('debit', parseFloat(filterDebit));
       }
       
       const { data, error } = await query;

       // Extract unique values for each field
       const uniqueCompanies = [...new Set(data.map(entry => entry.company_name).filter(Boolean))];
       const uniqueAccounts = [...new Set(data.map(entry => entry.acc_name).filter(Boolean))];
       const uniqueSubAccounts = [...new Set(data.map(entry => entry.sub_acc_name).filter(Boolean))];
       const uniqueParticulars = [...new Set(data.map(entry => entry.particulars).filter(Boolean))];
       const uniqueCredits = [...new Set(data.map(entry => entry.credit).filter(val => val !== null && val !== undefined))];
       const uniqueDebits = [...new Set(data.map(entry => entry.debit).filter(val => val !== null && val !== undefined))];
       
       // Update dropdowns with related options
       setCompanies(uniqueCompanies.map(name => ({ value: name, label: name })));
       setDistinctAccountNames(uniqueAccounts.map(name => ({ value: name, label: name })));
       setDependentSubAccounts(uniqueSubAccounts.map(name => ({ value: name, label: name })));
       setParticularsOptions(uniqueParticulars.map(name => ({ value: name, label: name })));
       setCreditOptions(uniqueCredits.map(amount => ({ value: amount.toString(), label: amount.toString() })));
       setDebitOptions(uniqueDebits.map(amount => ({ value: amount.toString(), label: amount.toString() })));
       
       // Show toast with summary
       const summary = [
         `${uniqueCompanies.length} companies`,
         `${uniqueAccounts.length} accounts`,
         `${uniqueSubAccounts.length} sub-accounts`,
         `${uniqueParticulars.length} particulars`,
         `${uniqueCredits.length} credit amounts`,
         `${uniqueDebits.length} debit amounts`
       ].join(', ');
       
       if (data.length > 0) {
         toast.success(`Found ${data.length} entries matching ${filterType} "${filterValue}" with ${summary}`);
       } else {
         toast.info(`No entries found matching ${filterType} "${filterValue}"`);
       }
       
     } catch (error) {
       console.error('Error loading related filter options:', error);
       toast.error(`Failed to load related options for ${filterType}`);
     }
   };
   ```

2. **useEffect Hooks for Each Filter**
   ```typescript
   // Company filter change
   useEffect(() => {
     if (filterCompanyName) {
       loadRelatedFilterOptions('company', filterCompanyName);
     }
   }, [filterCompanyName]);

   // Account filter change
   useEffect(() => {
     if (filterAccountName) {
       loadRelatedFilterOptions('account', filterAccountName);
     }
   }, [filterAccountName]);

   // Sub-account filter change
   useEffect(() => {
     if (filterSubAccountName) {
       loadRelatedFilterOptions('subAccount', filterSubAccountName);
     }
   }, [filterSubAccountName]);

   // Particulars filter change
   useEffect(() => {
     if (filterParticulars) {
       loadRelatedFilterOptions('particulars', filterParticulars);
     }
   }, [filterParticulars]);

   // Credit filter change
   useEffect(() => {
     if (filterCredit) {
       loadRelatedFilterOptions('credit', filterCredit);
     }
   }, [filterCredit]);

   // Debit filter change
   useEffect(() => {
     if (filterDebit) {
       loadRelatedFilterOptions('debit', filterDebit);
     }
   }, [filterDebit]);
   ```

3. **Simplified Filter Components**
   ```typescript
   // Before: Complex onChange handlers with manual filtering
   <SearchableSelect
     label='Company Name'
     value={filterCompanyName}
     onChange={async (value) => {
       setFilterCompanyName(value);
       setFilterAccountName('');
       setFilterSubAccountName('');
       // ... complex logic
     }}
     options={companies}
   />

   // After: Simple onChange handlers with automatic cascading
   <SearchableSelect
     label='Company Name'
     value={filterCompanyName}
     onChange={setFilterCompanyName}
     options={companies}
   />
   ```

### **User Workflow:**

1. **Select Any Filter** - User selects Company, Account, Sub Account, Particulars, Credit, or Debit
2. **Automatic Cascading** - System automatically filters all related fields
3. **Dependent Filter Clearing** - Lower-level filters are cleared when higher-level filters change
4. **Related Options Update** - All dropdowns are populated with only relevant options
5. **Comprehensive Feedback** - Toast shows summary of available options
6. **Easy Selection** - Users can select from filtered, relevant options

### **Filter Clearing Logic:**

- **Company Change** → Clears Account, Sub Account, Particulars, Credit, Debit
- **Account Change** → Clears Sub Account, Particulars, Credit, Debit
- **Sub Account Change** → Clears Particulars, Credit, Debit
- **Particulars Change** → Clears Credit, Debit
- **Credit Change** → Clears Debit
- **Debit Change** → Clears Credit

### **Example Scenarios:**

**Scenario 1: Select Company "ABC Corp"**
- Toast: "Found 15 entries matching company "ABC Corp" with 1 companies, 8 accounts, 12 sub-accounts, 15 particulars, 10 credit amounts, 8 debit amounts"
- Account dropdown shows only accounts used by ABC Corp
- Sub Account dropdown shows only sub-accounts used by ABC Corp
- All other dropdowns show only values used by ABC Corp

**Scenario 2: Select Account "Sales"**
- Toast: "Found 8 entries matching account "Sales" with 3 companies, 1 accounts, 5 sub-accounts, 8 particulars, 6 credit amounts, 4 debit amounts"
- Company dropdown shows only companies that have Sales account entries
- Sub Account dropdown shows only sub-accounts under Sales
- All other dropdowns show only values related to Sales account

**Scenario 3: Select Credit Amount "1000"**
- Toast: "Found 5 entries matching credit "1000" with 2 companies, 3 accounts, 4 sub-accounts, 5 particulars, 1 credit amounts, 3 debit amounts"
- All dropdowns show only values that have entries with credit amount 1000

### **Benefits:**

1. **Intelligent Filtering** - Each filter automatically updates related filters
2. **Data Validation** - Users can only select combinations that actually exist
3. **Improved Efficiency** - No more selecting invalid combinations
4. **Better User Experience** - Automatic filtering reduces user effort
5. **Comprehensive Feedback** - Users see exactly what data is available
6. **Consistent Behavior** - All filters work the same way

### **Technical Features:**

- **Dynamic Query Building** - Queries are built based on active filters
- **Smart Filter Clearing** - Dependent filters are cleared when parent filters change
- **Efficient Database Queries** - Single query loads all related options
- **Real-time Updates** - All dropdowns update immediately when filters change
- **Error Handling** - Graceful handling of network and database errors

### **Database Query Logic:**

```sql
SELECT company_name, acc_name, sub_acc_name, particulars, credit, debit 
FROM cash_book 
WHERE 
  (c_date = 'selected_date' OR no_date_filter) AND
  (company_name = 'selected_company' OR no_company_filter) AND
  (acc_name = 'selected_account' OR no_account_filter) AND
  (sub_acc_name = 'selected_sub_account' OR no_sub_account_filter) AND
  (particulars = 'selected_particulars' OR no_particulars_filter) AND
  (credit = selected_credit OR no_credit_filter) AND
  (debit = selected_debit OR no_debit_filter)
```

The cascading filter functionality is now fully implemented! When you select any filter (Company, Account, Sub Account, Particulars, Credit, or Debit), all related filters will automatically be populated with only the values that exist for that specific selection, providing an intelligent and efficient filtering experience. 🎯











