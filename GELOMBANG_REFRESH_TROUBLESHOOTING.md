# 🔧 Troubleshooting: Gelombang Auto Refresh

## Problem Description

**Issue**: Setelah mengklik tombol "Jadikan Aktif", gelombang tidak otomatis refresh dan UI tidak ter-update.

## Enhanced Debugging

### 1. Console Logs yang Ditambahkan

Sekarang ada logging yang lebih detail untuk troubleshooting:

```javascript
// Step 5: Reloading data
console.log('[GELOMBANG] Step 5: Reloading data from database (force refresh)');
console.log('[GELOMBANG]   → Calling loadGelombangData(true)...');

// Verification after reload
console.log('[GELOMBANG]   → Container content length:', updatedContainer.innerHTML.length);
console.log('[GELOMBANG]   → Container has gelombang cards:', updatedContainer.querySelectorAll('.card').length);

// Final verification (1 second delay)
console.log('[GELOMBANG] 🔍 Final verification:');
console.log('[GELOMBANG]   → Active cards (green border):', activeCards.length);
console.log('[GELOMBANG]   → Inactive cards (gray border):', inactiveCards.length);
```

### 2. Error Handling yang Diperkuat

```javascript
try {
  await loadGelombangData(true);
  console.log('[GELOMBANG]   ✅ Data reloaded successfully');
} catch (reloadError) {
  console.error('[GELOMBANG]   ❌ Failed to reload data:', reloadError);
  throw reloadError; // Re-throw to trigger error handling
}
```

### 3. Fallback Mechanism

Jika `loadGelombangData` gagal, ada fallback:

```javascript
catch (rollbackError) {
  console.error('[GELOMBANG]   ❌ Rollback failed:', rollbackError);
  
  // Last resort: manual page refresh
  console.log('[GELOMBANG] 🔄 Last resort: Manual page refresh in 2 seconds...');
  setTimeout(() => {
    console.log('[GELOMBANG] 🔄 Refreshing page...');
    location.reload();
  }, 2000);
}
```

## Testing Steps

### 1. Basic Test

1. **Open Browser Console** (F12)
2. **Go to Gelombang tab**
3. **Click "Jadikan Aktif"** pada gelombang yang tidak aktif
4. **Confirm dialog**
5. **Watch console logs**

**Expected Console Output**:
```
[GELOMBANG] ========================================
[GELOMBANG] 🚀 START: Activating Gelombang 2
[GELOMBANG] ========================================
[GELOMBANG] Step 1: Calling API /api/set_gelombang_active
[GELOMBANG]   → Request payload: {id: 2}
[GELOMBANG]   → Response status: 200 OK
[GELOMBANG] Step 2: API Response received: {...}
[GELOMBANG] ✅ Step 2 SUCCESS - API call completed
[GELOMBANG] Step 3: Broadcasting to other tabs via localStorage
[GELOMBANG]   ✅ Broadcast sent: {...}
[GELOMBANG] Step 4: Dispatching custom event
[GELOMBANG]   ✅ Custom event dispatched
[GELOMBANG] Step 5: Reloading data from database (force refresh)
[GELOMBANG]   → Calling loadGelombangData(true)...
[GELOMBANG] ========================================
[GELOMBANG] 📊 Loading gelombang data (FORCE REFRESH)
[GELOMBANG] ========================================
[GELOMBANG] Step 1: Fetching from /api/get_gelombang_list?_t=1730000000000
[GELOMBANG] Step 2: Response received
[GELOMBANG] Step 3: JSON parsed successfully
[GELOMBANG] Step 4: Data validation passed
[GELOMBANG] Step 5: Storing data and rendering...
[GELOMBANG] ✅ SUCCESS: Data loaded and rendered!
[GELOMBANG]   ✅ Data reloaded successfully
[GELOMBANG]   → Container content length: 12345
[GELOMBANG]   → Container has gelombang cards: 3
[GELOMBANG] ✅ SUCCESS: Gelombang 2 is now ACTIVE
[GELOMBANG] ✅ UI updated successfully - staying on Gelombang tab
[GELOMBANG] 🔍 Final verification:
[GELOMBANG]   → Active cards (green border): 1
[GELOMBANG]   → Inactive cards (gray border): 2
[GELOMBANG] ✅ UI refresh successful - exactly 1 active gelombang
```

### 2. Error Test

Jika ada error, console akan menampilkan:

```
[GELOMBANG] ❌ ERROR during activation: [error details]
[GELOMBANG] 🔄 Rollback: Reloading data from database...
[GELOMBANG]   ✅ Rollback complete
```

Atau jika rollback gagal:

```
[GELOMBANG]   ❌ Rollback failed: [error details]
[GELOMBANG] 🔄 Last resort: Manual page refresh in 2 seconds...
[GELOMBANG] 🔄 Refreshing page...
```

## Common Issues & Solutions

### Issue 1: `loadGelombangData` Gagal

**Symptoms**:
- Console: `❌ Failed to reload data: [error]`
- UI tidak ter-update
- Gelombang tetap status lama

**Possible Causes**:
1. API `/api/get_gelombang_list` error
2. Network timeout
3. JavaScript error di `renderGelombangForms`

**Solutions**:
1. Check Network tab untuk API errors
2. Check console untuk JavaScript errors
3. Manual refresh akan trigger otomatis setelah 2 detik

### Issue 2: UI Update Gagal

**Symptoms**:
- Console: `⚠️ UI refresh may have failed - unexpected active count: 0`
- Container content length: 0
- No gelombang cards found

**Possible Causes**:
1. `renderGelombangForms` error
2. Container element tidak ditemukan
3. Data format tidak sesuai

**Solutions**:
1. Check `renderGelombangForms` function
2. Verify `#gelombangContainer` exists
3. Check data format dari API

### Issue 3: API Call Gagal

**Symptoms**:
- Console: `❌ HTTP Error: 500 Internal Server Error`
- Network tab shows red request
- Alert error muncul

**Possible Causes**:
1. Backend error di `set_gelombang_active`
2. Database connection issue
3. Permission issue

**Solutions**:
1. Check backend logs
2. Verify database connection
3. Check API endpoint manually

## Manual Testing Commands

### 1. Test API Endpoint
```javascript
// Test get gelombang list
fetch('/api/get_gelombang_list')
  .then(r => r.json())
  .then(d => console.log('Gelombang data:', d));

// Test set gelombang active
fetch('/api/set_gelombang_active', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({id: 2})
})
.then(r => r.json())
.then(d => console.log('Set active result:', d));
```

### 2. Test loadGelombangData Function
```javascript
// Manual test loadGelombangData
loadGelombangData(true);
```

### 3. Test renderGelombangForms Function
```javascript
// Test with sample data
const sampleData = [
  {id: 1, nama: 'Gelombang 1', is_active: false},
  {id: 2, nama: 'Gelombang 2', is_active: true},
  {id: 3, nama: 'Gelombang 3', is_active: false}
];
renderGelombangForms(sampleData);
```

## Debugging Checklist

### 1. Console Logs
- [ ] `[GELOMBANG] 🚀 START: Activating Gelombang X`
- [ ] `[GELOMBANG] ✅ Step 2 SUCCESS - API call completed`
- [ ] `[GELOMBANG] Step 5: Reloading data from database (force refresh)`
- [ ] `[GELOMBANG] ✅ Data reloaded successfully`
- [ ] `[GELOMBANG] ✅ UI refresh successful - exactly 1 active gelombang`

### 2. Network Tab
- [ ] POST `/api/set_gelombang_active` → 200 OK
- [ ] GET `/api/get_gelombang_list?_t=...` → 200 OK
- [ ] Response data contains updated `is_active` values

### 3. UI Verification
- [ ] Container opacity changes to 0.6 during loading
- [ ] Spinner appears with "Memperbarui data gelombang..."
- [ ] Container opacity returns to 1 after completion
- [ ] Exactly 1 gelombang has green border (active)
- [ ] Other gelombangs have gray border (inactive)
- [ ] Success notification appears

### 4. Error Scenarios
- [ ] API error → Error notification + rollback
- [ ] Network timeout → Error notification + rollback
- [ ] Rollback fails → Manual page refresh after 2 seconds

## Performance Monitoring

### Expected Timings
- **API Call**: ~500ms - 2s
- **Data Reload**: ~300ms - 1s
- **UI Update**: ~100ms - 500ms
- **Total Process**: ~1s - 3.5s

### Slow Performance Indicators
- API call > 5 seconds
- Data reload > 3 seconds
- Total process > 10 seconds

### Timeout Handling
- API timeout: 30 seconds (browser default)
- Manual refresh fallback: 2 seconds after rollback failure

## Production Monitoring

### Success Metrics
- Console logs show successful completion
- UI updates within 5 seconds
- No manual page refresh needed
- User stays on Gelombang tab

### Failure Metrics
- Console shows error messages
- UI doesn't update after 10 seconds
- Manual page refresh triggered
- User reports "not working"

## Quick Fixes

### If Auto Refresh Still Not Working

1. **Check Console Errors**:
   ```javascript
   // Look for these error patterns:
   // ❌ ERROR during activation
   // ❌ Failed to reload data
   // ❌ Rollback failed
   ```

2. **Manual Refresh Test**:
   ```javascript
   // Test in console:
   loadGelombangData(true);
   ```

3. **Force Page Refresh**:
   ```javascript
   // If all else fails:
   location.reload();
   ```

4. **Check API Endpoints**:
   ```bash
   # Test API manually:
   curl -X GET "https://your-domain.vercel.app/api/get_gelombang_list"
   curl -X POST "https://your-domain.vercel.app/api/set_gelombang_active" \
     -H "Content-Type: application/json" \
     -d '{"id": 2}'
   ```

---

**Status**: Enhanced with better debugging and fallback mechanisms
**Last Updated**: 2025-10-24
**Testing**: Ready for production deployment
