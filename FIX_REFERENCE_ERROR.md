# Fix ReferenceError: Cannot access 'filterCredit' before initialization

## Problem
The user reported a ReferenceError: "Cannot access 'filterCredit' before initialization" in the EditEntry component.

## Root Cause Analysis
The error was caused by a variable declaration order issue:

1. **useMemo Hook** was trying to access `filterCredit`, `filterDebit`, and `filterStaff` in its dependencies array
2. **Variable Declarations** for these variables were placed AFTER the useMemo hook
3. **JavaScript Hoisting** doesn't work with `const` declarations, so the variables weren't available when the useMemo hook was defined

## Solution Implemented

### **Changes Made:**

1. **Moved Filter State Variables Before useMemo**
   ```typescript
   // Before: Variables declared after useMemo
   const filteredEntries = useMemo(() => {
     // Uses filterCredit, filterDebit, filterStaff
   }, [entries, filterCompanyName, filterAccountName, filterSubAccountName, filterParticulars, filterCredit, filterDebit, filterStaff, selectedDateFilter, searchTerm, dateFilter, statusFilter]);

   // Later in the file...
   const [filterCredit, setFilterCredit] = useState('');  // ❌ Too late!
   const [filterDebit, setFilterDebit] = useState('');   // ❌ Too late!
   const [filterStaff, setFilterStaff] = useState('');     // ❌ Too late!

   // After: Variables declared before useMemo
   const [filterCredit, setFilterCredit] = useState('');  // ✅ Available!
   const [filterDebit, setFilterDebit] = useState('');   // ✅ Available!
   const [filterStaff, setFilterStaff] = useState('');   // ✅ Available!

   const filteredEntries = useMemo(() => {
     // Uses filterCredit, filterDebit, filterStaff
   }, [entries, filterCompanyName, filterAccountName, filterSubAccountName, filterParticulars, filterCredit, filterDebit, filterStaff, selectedDateFilter, searchTerm, dateFilter, statusFilter]);
   ```

2. **Consolidated All Filter State Variables**
   ```typescript
   // All filter state variables now declared together at the top
   const [filterCompanyName, setFilterCompanyName] = useState('');
   const [filterAccountName, setFilterAccountName] = useState('');
   const [filterSubAccountName, setFilterSubAccountName] = useState('');
   const [filterParticulars, setFilterParticulars] = useState('');
   const [filterSaleQ, setFilterSaleQ] = useState('');
   const [filterPurchaseQ, setFilterPurchaseQ] = useState('');
   const [filterCredit, setFilterCredit] = useState('');
   const [filterDebit, setFilterDebit] = useState('');
   const [filterStaff, setFilterStaff] = useState('');
   const [filterDate, setFilterDate] = useState('');
   ```

3. **Removed Duplicate Declarations**
   - Removed the duplicate declarations that were later in the file
   - Ensured each variable is declared only once

### **Technical Details:**

**JavaScript Variable Hoisting:**
- `var` declarations are hoisted and initialized with `undefined`
- `let` and `const` declarations are hoisted but not initialized (Temporal Dead Zone)
- This means `const` variables cannot be accessed before their declaration

**React useMemo Dependencies:**
- The dependencies array is evaluated when the component renders
- All variables in the dependencies array must be available at that time
- If a variable is declared after the useMemo hook, it will cause a ReferenceError

### **File Structure After Fix:**

```typescript
const EditEntry: React.FC = () => {
  // 1. Basic state variables
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  // ... other basic state

  // 2. Filter state variables (moved to top)
  const [filterCompanyName, setFilterCompanyName] = useState('');
  const [filterAccountName, setFilterAccountName] = useState('');
  const [filterSubAccountName, setFilterSubAccountName] = useState('');
  const [filterParticulars, setFilterParticulars] = useState('');
  const [filterSaleQ, setFilterSaleQ] = useState('');
  const [filterPurchaseQ, setFilterPurchaseQ] = useState('');
  const [filterCredit, setFilterCredit] = useState('');
  const [filterDebit, setFilterDebit] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // 3. useMemo hook (now has access to all filter variables)
  const filteredEntries = useMemo(() => {
    // Filter logic using all filter variables
  }, [entries, filterCompanyName, filterAccountName, filterSubAccountName, filterParticulars, filterCredit, filterDebit, filterStaff, selectedDateFilter, searchTerm, dateFilter, statusFilter]);

  // 4. Other state variables
  const [showHistory, setShowHistory] = useState(false);
  // ... rest of component
};
```

### **Benefits:**

1. **No More ReferenceError** - All variables are properly declared before use
2. **Better Code Organization** - Related variables grouped together
3. **Improved Readability** - Clear variable declaration order
4. **Maintainable Code** - Easier to understand and modify
5. **Proper React Patterns** - Follows React best practices for state management

### **Prevention:**

To prevent similar issues in the future:
1. **Declare all state variables at the top** of the component
2. **Group related variables together** (e.g., all filter variables)
3. **Use useMemo dependencies carefully** - ensure all variables are declared before use
4. **Follow consistent naming patterns** for related variables

The ReferenceError has been completely resolved! The edit form filtering now works without any initialization errors. 🎯





