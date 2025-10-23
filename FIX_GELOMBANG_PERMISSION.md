# 🔧 Fix Gelombang RPC Permission & UI Update

## ❌ **Problem Identified**

1. **RPC Permission Error**
   - Anon role tidak punya EXECUTE permission
   - Frontend call RPC gagal silent error

2. **UI Not Updating**
   - Data di DB sudah berubah
   - Frontend tidak refresh tampilan

3. **Toastr Error**
   - "Cannot read properties of undefined"
   - Already fixed in previous update

---

## ✅ **Solution - 3 Steps**

### **Step 1: Grant RPC Permission (CRITICAL!)**

Open Supabase SQL Editor dan run:

```sql
-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO anon;

-- Grant execute permission to authenticated role
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO authenticated;

-- Verify it worked
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'set_gelombang_status';
```

**Expected Output:**
```
routine_name          | grantee        | privilege_type
----------------------|----------------|---------------
set_gelombang_status  | anon           | EXECUTE
set_gelombang_status  | authenticated  | EXECUTE
```

✅ **File available:** `sql/grant_rpc_gelombang.sql`

---

### **Step 2: Verify Frontend Code**

Your `admin.js` already has the correct implementation:

```javascript
// Line ~1356-1412 in admin.js
async function setGelombangActive(id) {
  id = parseInt(id, 10);
  
  if (!confirm('Jadikan gelombang ini aktif?')) {
    return;
  }
  
  console.log('[GELOMBANG] Activating gelombang via Supabase RPC:', id);
  
  if (!window.supabase) {
    toastr.error('❌ Supabase client not initialized!');
    return;
  }
  
  try {
    // Show loading
    toastr.info('⏳ Mengaktifkan gelombang...');
    
    // Call RPC
    const { data, error } = await window.supabase.rpc('set_gelombang_status', { p_id: id });
    
    if (error) {
      throw new Error(`Supabase RPC error: ${error.message}`);
    }
    
    console.log('[GELOMBANG] RPC success:', data);
    
    // Show success
    toastr.success(`✅ Gelombang ${id} berhasil diaktifkan!`);
    
    // Reload data to show updated status and colors
    await loadGelombangData(true);
    
    // Broadcast to localStorage for index.html sync
    localStorage.setItem('gelombang_update', Date.now().toString());
    
    console.log('[GELOMBANG] ✅ UI refreshed successfully');
    
  } catch (error) {
    console.error('[GELOMBANG] Error activating:', error);
    toastr.error(`❌ Gagal mengubah gelombang: ${error.message}`);
  }
}
```

✅ **This code is already in your `admin.js`!**

---

### **Step 3: Deploy & Test**

```bash
git add .
git commit -m "fix: add RPC permission grant for gelombang"
git push origin main
```

---

## 🧪 **Testing Procedure**

### **Test 1: Permission Granted**

1. Run SQL grant script in Supabase
2. Verify output shows `anon | EXECUTE`
3. ✅ **Pass if:** anon role has EXECUTE permission

### **Test 2: RPC Call Works**

1. Open admin.html
2. Login
3. Go to "Kelola Gelombang"
4. Open Console (F12)
5. Click "Jadikan Aktif" on Gelombang 2

**Expected Console Output:**
```
[GELOMBANG] Activating gelombang via Supabase RPC: 2
[GELOMBANG] RPC success: null
[GELOMBANG] Loading data from Supabase... (force refresh)
[GELOMBANG] Data loaded from Supabase: Array(3)
[GELOMBANG] 📡 Broadcasting update to public pages via localStorage
[GELOMBANG] ✅ UI refreshed successfully
```

**Expected UI:**
- Toast: "⏳ Mengaktifkan gelombang..."
- Toast: "✅ Gelombang 2 berhasil diaktifkan!"
- Cards update colors:
  - Gelombang 1: Gray (Ditutup)
  - Gelombang 2: Green (Aktif) ✅
  - Gelombang 3: Blue (Dibuka)

✅ **Pass if:** 
- No permission error
- UI updates immediately
- Colors change correctly

### **Test 3: Database Updated**

1. After RPC call succeeds
2. Open Supabase Dashboard
3. Database → Table Editor → gelombang

**Expected:**
| id | nama        | is_active | status   |
|----|-------------|-----------|----------|
|  1 | Gelombang 1 | false     | ditutup  |
|  2 | Gelombang 2 | true      | aktif    |
|  3 | Gelombang 3 | false     | dibuka   |

✅ **Pass if:** Database reflects the change

### **Test 4: Index.html Auto-Updates**

1. Open index.html in Tab 1
2. Open admin.html in Tab 2
3. Activate Gelombang 3 in Tab 2
4. Switch to Tab 1 (DO NOT REFRESH)

**Expected (Tab 1):**
- Page auto-updates in ~0.5s
- Gelombang 3 card → Green border
- Status → "AKTIF"
- Button → "Daftar Sekarang"

✅ **Pass if:** Index.html updates without manual refresh

---

## 🐛 **Troubleshooting**

### **Error: "permission denied for function set_gelombang_status"**

**Cause:** GRANT not executed

**Fix:**
```sql
GRANT EXECUTE ON FUNCTION public.set_gelombang_status(p_id integer) TO anon;
```

### **Error: "RPC success but UI not updating"**

**Cause:** `loadGelombangData()` not called or failed

**Check:**
1. Console shows: `[GELOMBANG] Loading data from Supabase...`?
2. Console shows: `[GELOMBANG] Data loaded from Supabase: Array(3)`?

**If NO:**
- Check `window.supabase` is defined
- Check network tab for API calls

### **Error: "Toastr is not defined"**

**Cause:** Already fixed in previous update

**Verify:** Check `admin.html` line ~1115-1144 has toastr initialization

### **Index.html not updating**

**Cause:** localStorage event not firing or Supabase real-time not connected

**Check:**
1. Console (F12) on index.html
2. Look for: `[SUPABASE INDEX] 🎧 Subscribed to real-time gelombang updates`
3. Look for: `[GELOMBANG] Admin updated gelombang, reloading...`

**If NO:**
- Check index.html has storage listener (line ~583-590)
- Check Supabase real-time subscription (line ~594-638)

---

## 📊 **Verification Checklist**

**Before Testing:**
- [ ] SQL grant executed in Supabase
- [ ] Verified `anon` has EXECUTE permission
- [ ] Code deployed to Vercel
- [ ] Browser cache cleared

**Core Functionality:**
- [ ] RPC call succeeds (no permission error)
- [ ] Toast "Mengaktifkan gelombang..." appears
- [ ] Toast "Berhasil diaktifkan!" appears
- [ ] UI updates immediately (no manual refresh)
- [ ] Colors change correctly (green/blue/gray)
- [ ] Database updates correctly

**Real-Time Sync:**
- [ ] localStorage event fires
- [ ] Index.html updates (same browser)
- [ ] Supabase real-time updates (cross-device)

---

## 🎯 **Expected Behavior After Fix**

### **Admin Panel:**
```
User clicks "Jadikan Aktif" on Gelombang 2
    ↓
Toast: "⏳ Mengaktifkan gelombang..."
    ↓
RPC call to Supabase (WITH permission now! ✅)
    ↓
Database updated
    ↓
Toast: "✅ Gelombang 2 berhasil diaktifkan!"
    ↓
loadGelombangData(true) fetches fresh data
    ↓
UI updates with new colors:
  • Gelombang 1: 🔘 Gray
  • Gelombang 2: 🟢 Green ✅
  • Gelombang 3: 🔵 Blue
    ↓
localStorage broadcast sent
    ↓
DONE! ✅
```

### **Public Page:**
```
Admin activates Gelombang 2
    ↓
localStorage event fires
    ↓
index.html detects change
    ↓
loadGelombangAktif() re-fetches data
    ↓
Gelombang 2 card updates to green
    ↓
Status badge → "AKTIF"
    ↓
Button → "Daftar Sekarang" (enabled)
    ↓
DONE! ✅ (no manual refresh needed)
```

---

## 🚀 **Quick Fix Commands**

```bash
# 1. Run SQL grant in Supabase SQL Editor
# Copy from: sql/grant_rpc_gelombang.sql

# 2. Deploy (code already updated)
git add .
git commit -m "fix: add RPC permission grant for gelombang"
git push origin main

# 3. Test
# - Clear browser cache
# - Login to admin
# - Click "Jadikan Aktif"
# - Watch console & UI update! ✅
```

---

## ✅ **Summary**

**Root Cause:**
- Missing GRANT EXECUTE permission for anon role
- RPC calls were silently failing

**Solution:**
1. ✅ Run SQL grant script
2. ✅ Code already correct (no changes needed)
3. ✅ Deploy and test

**Result:**
- RPC calls work
- UI updates immediately
- Real-time sync works
- No errors! 🎉

---

**Status:** ✅ Ready to fix with 1 SQL command!

