# 🧪 Batch Room Testing Guide

## Testing Mode
The application now includes comprehensive testing features that can be enabled/disabled via `TESTING_MODE` constant.

## How to Enable Testing
Set `TESTING_MODE = true` in both `app-new.js` and `batch.js` files.

## Testing Features

### 1. Message Posting Test
- **Anonymous Toggle**: Tests if "Hide my name" functionality works correctly
- **Network Error Simulation**: 15% chance of simulated network errors
- **Input Validation**: Tests message length and empty input handling
- **Author Verification**: Logs whether anonymous or real name is used

### 2. Profile Update Test  
- **Input Validation**: Tests city and work input validation
- **Network Error Simulation**: 15% chance of simulated network errors
- **Data Persistence**: Verifies profile data is saved correctly
- **Form Reset**: Tests if form clears after successful submission

### 3. Batch Creation Test
- **Duplicate Prevention**: Tests duplicate batch detection
- **Input Validation**: Tests institution and year validation
- **Network Error Simulation**: 20% chance of simulated network errors
- **Data Integrity**: Verifies batch data is saved correctly

## Console Output
When `TESTING_MODE = true`, you'll see:
- 🧪 TEST: Testing [Feature Name]
- ✅ [Feature Name] passed
- ❌ [Feature Name] failed

## Network Error Simulation
- Message Posting: 15% chance of simulated network error
- Profile Update: 15% chance of simulated network error  
- Batch Creation: 20% chance of simulated network error

## Production Deployment
Before deploying to production:
1. Set `TESTING_MODE = false` in both files
2. Remove or comment out all `logTest()` calls
3. Remove `simulateNetworkError()` function calls
4. Test all features manually

## Test Scenarios

### Happy Path Tests
1. **Valid Message Post**: ✅ Should work normally
2. **Anonymous Message**: ✅ Should show "Anonymous" as author
3. **Profile Update**: ✅ Should save city and work
4. **Batch Creation**: ✅ Should create new batch

### Error Path Tests
1. **Empty Message**: ❌ Should show validation error
2. **Long Message**: ❌ Should show length error
3. **Empty Profile**: ❌ Should show validation error
4. **Network Error**: ❌ Should show error toast
5. **Duplicate Batch**: ❌ Should show duplicate error

## Monitoring
Check browser console for:
- Test execution logs
- Error handling verification
- Network error simulation
- Feature success/failure status
