# Custom Data Column Feature for P&L Selection Summary

## Overview
Added a "Custom Data" column to the Balance Sheet P&L selection summary that allows users to add custom data for printing purposes only (not stored in database).

## Features Implemented

### 1. **Custom Data Input Column**
- **Location**: Balance Sheet table, new "Custom Data" column
- **Purpose**: Add custom text/data for each account for printing purposes
- **Storage**: In-memory only (not saved to database)
- **Input**: Small text input field with placeholder "Add custom data..."

### 2. **State Management**
- **State**: `customAccountData` - Map<string, string> to store custom data per account
- **Handler**: `handleCustomDataChange()` - Updates custom data for specific accounts
- **Persistence**: Data persists during the session but is lost on page refresh

### 3. **UI Enhancements**

#### **Table Updates**
- Added "Custom Data" column header to the main balance sheet table
- Added input field for each account row
- Input field includes tooltip: "Custom data for printing purposes only (not stored in database)"

#### **Button Controls**
- **Clear Custom Data**: New button to clear all custom data entries
- **Clear Cache**: Existing button for cache management
- **Clear All**: Existing button for P&L selection

#### **Summary Information**
- Added count of accounts with custom data in P&L Selection Summary
- Shows: "X account(s) have custom data for printing"

### 4. **Print Report Integration**

#### **P&L Section**
- Custom data column included in printed P&L report
- Shows custom data for each selected P&L account
- Displays "-" for accounts without custom data

#### **Balance Sheet Section**
- Custom data column included in printed Balance Sheet report
- Shows custom data for each Balance Sheet account
- Displays "-" for accounts without custom data

#### **Totals Row**
- Custom data column shows "-" in totals row (no aggregation)

### 5. **Export Functionality**

#### **Excel Export**
- Custom data column included in CSV/Excel export
- Column header: "Custom Data"
- Empty string for accounts without custom data

### 6. **User Experience**

#### **Visual Indicators**
- Small, compact input fields to not overwhelm the table
- Clear placeholder text: "Add custom data..."
- Tooltip explaining the purpose
- Blue text in summary showing count of accounts with custom data

#### **Data Management**
- Easy to add custom data by typing in the input field
- Easy to clear all custom data with one button click
- Data automatically removed when input field is cleared
- Session-based persistence (survives page navigation within session)

## Technical Implementation

### **State Structure**
```typescript
const [customAccountData, setCustomAccountData] = useState<Map<string, string>>(new Map());
```

### **Handler Function**
```typescript
const handleCustomDataChange = (accountName: string, value: string) => {
  setCustomAccountData(prev => {
    const newMap = new Map(prev);
    if (value.trim() === '') {
      newMap.delete(accountName);
    } else {
      newMap.set(accountName, value);
    }
    return newMap;
  });
};
```

### **Table Integration**
- Input field in each account row
- Responsive design with max-width constraint
- Focus states and styling consistent with existing UI

### **Print Integration**
- Custom data included in both P&L and Balance Sheet sections
- Proper HTML table structure maintained
- Consistent styling with existing print format

## Usage Instructions

### **Adding Custom Data**
1. Navigate to Balance Sheet page
2. Find the "Custom Data" column in the table
3. Click in the input field for any account
4. Type your custom data (e.g., "Q1 Notes", "Special Project", etc.)
5. Press Enter or click elsewhere to save

### **Viewing Custom Data**
- Custom data appears in the "Custom Data" column
- Summary shows count of accounts with custom data
- Data persists during the session

### **Printing with Custom Data**
1. Add custom data to desired accounts
2. Select accounts for P&L section (if needed)
3. Click "Print P&L Report" button
4. Custom data will appear in the printed report

### **Clearing Custom Data**
- **Individual**: Clear the input field for specific account
- **All**: Click "Clear Custom Data" button

## Benefits

### **For Users**
- **Flexibility**: Add custom notes, project codes, or additional information
- **Print Enhancement**: Include custom data in printed reports
- **No Database Impact**: Custom data doesn't affect stored data
- **Easy Management**: Simple input fields with clear controls

### **For Business**
- **Custom Reporting**: Tailor reports with additional context
- **Project Tracking**: Add project codes or notes to accounts
- **Temporary Data**: Add session-specific information without permanent storage
- **Professional Output**: Enhanced printed reports with custom information

## Data Persistence

### **Session-Based**
- Custom data persists during the browser session
- Data is lost when page is refreshed or browser is closed
- Data survives navigation within the application

### **Not Database Stored**
- Custom data is never sent to the server
- No database modifications required
- No impact on existing data integrity

## Future Enhancements

### **Potential Improvements**
1. **Save to Local Storage**: Persist custom data across browser sessions
2. **Export Custom Data**: Separate export of just custom data
3. **Custom Data Templates**: Pre-defined custom data options
4. **Bulk Operations**: Apply custom data to multiple accounts at once
5. **Custom Data Validation**: Character limits or format validation

### **Advanced Features**
1. **Custom Data Categories**: Different types of custom data (notes, codes, etc.)
2. **Custom Data History**: Track changes to custom data
3. **Custom Data Search**: Search accounts by custom data content
4. **Custom Data Reports**: Generate reports based on custom data

## Testing

### **Test Scenarios**
1. **Add Custom Data**: Verify data appears in table and summary
2. **Print Report**: Verify custom data appears in printed report
3. **Clear Data**: Verify data is removed from table and summary
4. **Export**: Verify custom data appears in Excel export
5. **Session Persistence**: Verify data persists during navigation
6. **Page Refresh**: Verify data is lost on page refresh

### **Edge Cases**
1. **Empty Input**: Verify empty input removes custom data
2. **Special Characters**: Verify special characters work in custom data
3. **Long Text**: Verify long custom data displays properly
4. **Multiple Accounts**: Verify custom data works for multiple accounts

