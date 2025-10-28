# Custom Row Feature for Balance Sheet

## Overview
Replaced the custom data column with a comprehensive custom row feature that allows users to add complete account entries with all fields (Account Name, Debit, Credit, Balance, Result) for printing purposes only.

## Features Implemented

### 1. **Custom Row Addition**
- **Add Custom Row Button**: Located at the bottom of the balance sheet table
- **Form Fields**: Complete form with all account fields:
  - Account Name (text input)
  - Credit (number input)
  - Debit (number input)
  - Balance (number input)
  - Result (dropdown: CREDIT/DEBIT)
- **P&L Selection**: Checkbox to include custom row in P&L section

### 2. **Visual Design**
- **Custom Rows**: Highlighted with yellow background and border
- **Add Row Button**: Dashed border to indicate it's an action row
- **Form Row**: Blue background when adding a new row
- **Action Row**: Green background with Add/Cancel buttons
- **Custom Label**: "(Custom)" label next to account names

### 3. **State Management**
- **customRows**: Array of BalanceSheetAccount objects
- **showAddRow**: Boolean to show/hide the add row form
- **newRowData**: Object containing form data for new row
- **Session Persistence**: Custom rows persist during session

### 4. **User Interface**

#### **Add Row Process**
1. Click "+ Add Custom Row" button
2. Form appears with input fields for all account data
3. Fill in the required information
4. Click "Add Row" to save or "Cancel" to discard
5. Custom row appears in the table with yellow highlighting

#### **Row Management**
- **Remove**: Custom rows can be removed (future enhancement)
- **Edit**: Custom rows can be edited (future enhancement)
- **P&L Selection**: Custom rows can be selected for P&L section
- **Clear All**: "Clear Custom Rows" button removes all custom rows

### 5. **Print Integration**

#### **P&L Section**
- Custom rows included in P&L section if selected
- "(Custom)" label appears next to custom account names
- Totals include custom row values

#### **Balance Sheet Section**
- Custom rows included in Balance Sheet section if not selected for P&L
- "(Custom)" label appears next to custom account names
- Totals include custom row values

### 6. **Export Functionality**

#### **Excel Export**
- Custom rows included in CSV/Excel export
- Account names show "(Custom)" suffix
- All custom row data included in export

### 7. **Summary Information**
- **P&L Selection Summary**: Shows count of custom rows added
- **Real-time Updates**: Summary updates as custom rows are added/removed

## Technical Implementation

### **State Structure**
```typescript
const [customRows, setCustomRows] = useState<BalanceSheetAccount[]>([]);
const [showAddRow, setShowAddRow] = useState(false);
const [newRowData, setNewRowData] = useState({
  accountName: '',
  credit: 0,
  debit: 0,
  balance: 0,
  result: 'CREDIT',
  plYesNo: 'NO',
  bothYesNo: 'NO',
});
```

### **Handler Functions**
```typescript
const handleNewRowDataChange = (field: string, value: string | number) => {
  setNewRowData(prev => ({ ...prev, [field]: value }));
};

const addCustomRow = () => {
  // Validation and row addition logic
};

const removeCustomRow = (index: number) => {
  // Row removal logic
};
```

### **Table Integration**
- Custom rows rendered after regular balance sheet data
- Distinct styling with yellow background
- Form row with blue background for adding new rows
- Action row with green background for buttons

## Usage Instructions

### **Adding Custom Rows**
1. Navigate to Balance Sheet page
2. Scroll to bottom of the table
3. Click "+ Add Custom Row" button
4. Fill in the form fields:
   - **Account Name**: Enter the account name
   - **Credit**: Enter credit amount (number)
   - **Debit**: Enter debit amount (number)
   - **Balance**: Enter balance amount (number)
   - **Result**: Select CREDIT or DEBIT
5. Check P&L checkbox if you want this row in P&L section
6. Click "Add Row" to save or "Cancel" to discard

### **Managing Custom Rows**
- **P&L Selection**: Use the checkbox to include custom rows in P&L section
- **Clear All**: Click "Clear Custom Rows" button to remove all custom rows
- **View Summary**: Check P&L Selection Summary for custom row count

### **Printing with Custom Rows**
1. Add custom rows as needed
2. Select rows for P&L section (if desired)
3. Click "Print P&L Report" button
4. Custom rows will appear in the printed report with "(Custom)" labels

### **Exporting Custom Rows**
1. Add custom rows as needed
2. Click "Export" button
3. Custom rows will be included in the Excel/CSV file with "(Custom)" labels

## Benefits

### **For Users**
- **Complete Control**: Add full account entries with all fields
- **Flexible Reporting**: Create custom accounts for specific reporting needs
- **Print Enhancement**: Include custom data in printed reports
- **No Database Impact**: Custom rows don't affect stored data
- **Easy Management**: Simple form-based interface

### **For Business**
- **Custom Reporting**: Create accounts for specific projects or periods
- **Temporary Entries**: Add session-specific accounts without permanent storage
- **Professional Output**: Enhanced printed reports with custom information
- **Flexible Analysis**: Include custom calculations or adjustments

## Data Persistence

### **Session-Based**
- Custom rows persist during the browser session
- Data is lost when page is refreshed or browser is closed
- Data survives navigation within the application

### **Not Database Stored**
- Custom rows are never sent to the server
- No database modifications required
- No impact on existing data integrity

## Visual Design

### **Color Coding**
- **Regular Rows**: White/blue alternating background
- **Custom Rows**: Yellow background with yellow border
- **Add Row Button**: Gray background with dashed border
- **Form Row**: Blue background with blue border
- **Action Row**: Green background with green border

### **Labels and Indicators**
- **Custom Label**: "(Custom)" appears next to custom account names
- **Summary Count**: Shows number of custom rows added
- **Form Validation**: Add button disabled until account name is entered

## Future Enhancements

### **Potential Improvements**
1. **Edit Custom Rows**: Allow editing of existing custom rows
2. **Delete Individual Rows**: Remove specific custom rows
3. **Duplicate Rows**: Copy existing rows as custom rows
4. **Row Templates**: Pre-defined custom row templates
5. **Bulk Operations**: Add multiple custom rows at once

### **Advanced Features**
1. **Custom Row Categories**: Different types of custom rows
2. **Custom Row Validation**: Business rule validation for custom rows
3. **Custom Row History**: Track changes to custom rows
4. **Custom Row Search**: Search custom rows by account name
5. **Custom Row Reports**: Generate reports based on custom rows only

## Testing

### **Test Scenarios**
1. **Add Custom Row**: Verify form appears and row is added
2. **Form Validation**: Verify account name is required
3. **P&L Selection**: Verify custom rows can be selected for P&L
4. **Print Report**: Verify custom rows appear in printed report
5. **Export**: Verify custom rows appear in Excel export
6. **Clear Rows**: Verify all custom rows are removed
7. **Session Persistence**: Verify custom rows persist during navigation

### **Edge Cases**
1. **Empty Form**: Verify form validation works
2. **Duplicate Names**: Verify duplicate account names are allowed
3. **Special Characters**: Verify special characters work in account names
4. **Large Numbers**: Verify large numbers display properly
5. **Multiple Rows**: Verify multiple custom rows work correctly

## Comparison with Previous Implementation

### **Removed Features**
- Custom data column in table
- Individual input fields for each account
- Custom data state management

### **Added Features**
- Complete custom row functionality
- Form-based row addition
- Full account data entry
- Visual row highlighting
- Comprehensive print integration

### **Improved User Experience**
- **More Intuitive**: Form-based approach is more user-friendly
- **Complete Data**: Users can enter all account fields
- **Better Visual**: Clear distinction between regular and custom rows
- **Flexible**: Custom rows can be used for P&L or Balance Sheet







