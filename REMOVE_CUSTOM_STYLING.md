# Remove Custom Row Styling

## Problem
The user wanted to remove the yellow background color from custom rows in the table and also remove the "(Custom)" label from both the table display and print output, so custom rows look exactly like regular rows.

## Solution Implemented

### **Changes Made:**

1. **Removed Yellow Background from Table Display**
   ```typescript
   // Before
   <tr key={`custom-${idx}`} className='bg-yellow-50 border-2 border-yellow-300'>
   
   // After
   <tr key={`custom-${idx}`}>
   ```

2. **Removed "(Custom)" Label from Table Display**
   ```typescript
   // Before
   <td className='px-3 py-2 font-semibold text-yellow-800'>
     {customRow.accountName} <span className='text-xs text-yellow-600'>(Custom)</span>
   </td>
   
   // After
   <td className='px-3 py-2 font-semibold'>
     {customRow.accountName}
   </td>
   ```

3. **Removed "(Custom)" Label from Print Output**
   ```typescript
   // Before
   <td>${acc.accountName}${customRows.some(cr => cr.accountName === acc.accountName) ? ' <span style="color: #d97706;">(Custom)</span>' : ''}</td>
   
   // After
   <td>${acc.accountName}</td>
   ```

4. **Removed "(Custom)" Label from Excel Export**
   ```typescript
   // Before
   'Account Name': account.accountName + (customRows.some(cr => cr.accountName === account.accountName) ? ' (Custom)' : ''),
   
   // After
   'Account Name': account.accountName,
   ```

### **New Behavior:**

#### **Before:**
- Custom rows had yellow background (`bg-yellow-50 border-2 border-yellow-300`)
- Custom rows showed "(Custom)" label in table
- Print output included "(Custom)" labels
- Excel export included "(Custom)" labels

#### **After:**
- Custom rows have no special background (same as regular rows)
- Custom rows show only the account name (no "(Custom)" label)
- Print output shows clean account names (no "(Custom)" labels)
- Excel export shows clean account names (no "(Custom)" labels)

### **Visual Changes:**

#### **Table Display:**
- **Before**: Yellow background with "(Custom)" label
- **After**: Clean white background, no special labeling

#### **Print Output:**
- **Before**: Account names with orange "(Custom)" labels
- **After**: Clean account names without any special labels

#### **Excel Export:**
- **Before**: Account names with "(Custom)" suffix
- **After**: Clean account names without any suffix

### **Benefits:**
1. **Clean Appearance** - Custom rows blend seamlessly with regular rows
2. **Professional Look** - No visual distinction between data sources
3. **Consistent Formatting** - All rows have the same styling
4. **Clean Reports** - Print and export outputs look professional
5. **Better UX** - No distracting colors or labels

### **Technical Details:**
- **Table Styling**: Removed all yellow background classes
- **Text Styling**: Removed yellow text colors and custom labels
- **Print Logic**: Simplified account name display
- **Export Logic**: Clean account name mapping
- **Conditional Rendering**: Removed all custom row detection logic

### **User Experience:**
1. **Add Custom Row** - Row appears with normal styling
2. **View Table** - All rows look identical (no visual distinction)
3. **Print Report** - Clean, professional output
4. **Export Excel** - Clean data without special labels
5. **Consistent Experience** - No visual cues about data source

### **Maintained Functionality:**
- ✅ Custom rows still work exactly the same
- ✅ P&L selection still works for custom rows
- ✅ Print functionality still includes custom rows
- ✅ Excel export still includes custom rows
- ✅ All data processing remains unchanged

The only change is the visual presentation - custom rows now look exactly like regular rows in all contexts (table, print, export).




