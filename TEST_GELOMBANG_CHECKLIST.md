# ✅ Checklist Testing: Auto Refresh Kelola Gelombang

## Pre-Test Setup

- [ ] Login ke admin panel
- [ ] Pastikan ada minimal 3 gelombang di database
- [ ] Pastikan 1 gelombang sedang aktif
- [ ] Buka Browser Console (F12) untuk monitoring

---

## Test 1: Basic Switch Gelombang ✅

### Steps:
1. [ ] Klik menu "Kelola Gelombang" di sidebar
2. [ ] Lihat gelombang mana yang aktif (badge hijau "AKTIF")
3. [ ] Scroll ke gelombang yang tidak aktif
4. [ ] Klik tombol "Jadikan Aktif" (hijau dengan icon check-circle)
5. [ ] Confirm dialog yang muncul

### Expected Results:
- [ ] Container menjadi semi-transparan (opacity 0.6)
- [ ] Tidak bisa klik tombol lain (disabled)
- [ ] Muncul spinner loading dengan text "Memperbarui data gelombang..."
- [ ] Dalam 1-2 detik, data ter-refresh
- [ ] Badge gelombang yang baru aktif: "AKTIF" (hijau)
- [ ] Badge gelombang yang sebelumnya aktif: "Ditutup" (abu-abu)
- [ ] Tombol pada gelombang aktif berubah jadi "Aktif Sekarang" (disabled, abu-abu)
- [ ] Muncul notifikasi success (hijau) atau alert ✅
- [ ] User TETAP di tab "Kelola Gelombang" (tidak kembali ke tab Pendaftar)
- [ ] Container kembali normal (clickable, opacity 1)

### Console Log Check:
- [ ] `[GELOMBANG] 🚀 START: Activating Gelombang X`
- [ ] `[GELOMBANG] ✅ SUCCESS: Gelombang X is now ACTIVE`
- [ ] `[GELOMBANG] ✅ UI updated successfully - staying on Gelombang tab`
- [ ] No error messages (❌)

**Status**: [ ] PASS / [ ] FAIL

**Notes**: ___________________________________________

---

## Test 2: Cancel Confirmation ⏹️

### Steps:
1. [ ] Klik tombol "Jadikan Aktif" pada gelombang tidak aktif
2. [ ] Klik "Cancel" atau "Batal" di confirmation dialog

### Expected Results:
- [ ] Tidak ada perubahan pada UI
- [ ] Status gelombang tetap sama
- [ ] User tetap di tab "Kelola Gelombang"
- [ ] Console: `[GELOMBANG] ⏹️ User cancelled activation`

**Status**: [ ] PASS / [ ] FAIL

---

## Test 3: Multiple Sequential Switches 🔄

### Steps:
1. [ ] Switch dari Gelombang 1 → Gelombang 2
2. [ ] Tunggu sampai selesai (notifikasi success muncul)
3. [ ] Switch dari Gelombang 2 → Gelombang 3
4. [ ] Tunggu sampai selesai
5. [ ] Switch dari Gelombang 3 → Gelombang 1
6. [ ] Tunggu sampai selesai

### Expected Results:
- [ ] Setiap switch berhasil tanpa error
- [ ] Hanya 1 gelombang aktif setiap waktu
- [ ] UI selalu accurate (tidak ada multiple badge "AKTIF")
- [ ] Tidak ada page reload
- [ ] User tetap di tab Gelombang sepanjang test

### Console Log Check:
- [ ] 3x `[GELOMBANG] ✅ SUCCESS`
- [ ] Console table di setiap refresh menunjukkan `Active count: 1`
- [ ] No warnings: `Multiple active gelombang!`

**Status**: [ ] PASS / [ ] FAIL

**Notes**: ___________________________________________

---

## Test 4: Prevent Double Click 🚫

### Steps:
1. [ ] Klik tombol "Jadikan Aktif"
2. [ ] Confirm dialog
3. [ ] Saat container semi-transparan, coba klik tombol lain
4. [ ] Coba klik tombol "Jadikan Aktif" lagi

### Expected Results:
- [ ] Tombol tidak bisa diklik saat loading (pointer-events: none)
- [ ] No multiple API calls (check Network tab)
- [ ] Setelah selesai, container kembali clickable

**Status**: [ ] PASS / [ ] FAIL

---

## Test 5: Error Recovery 🛠️

### Setup (Simulate Error):
**Option A - Disconnect Internet**:
1. [ ] Disconnect internet/wifi
2. [ ] Try switching gelombang
3. [ ] Reconnect setelah error

**Option B - Block API** (Advanced):
```javascript
// Paste di console sebelum test:
const originalFetch = window.fetch;
window.fetch = (url, ...args) => {
  if (url.includes('set_gelombang_active')) {
    return Promise.reject(new Error('TEST: Network error'));
  }
  return originalFetch(url, ...args);
};
```

### Steps:
1. [ ] Setup error simulation
2. [ ] Klik "Jadikan Aktif"
3. [ ] Confirm

### Expected Results:
- [ ] Error notification ditampilkan (merah) atau alert ❌
- [ ] Container di-restore (opacity=1, clickable)
- [ ] Data di-rollback (load ulang dari database)
- [ ] Console: `[GELOMBANG] ❌ ERROR during activation`
- [ ] Console: `[GELOMBANG] 🔄 Rollback: Reloading data from database...`
- [ ] Console: `[GELOMBANG] ✅ Rollback complete`
- [ ] UI menampilkan data yang benar (sebelum error)
- [ ] User bisa try lagi

### Cleanup:
```javascript
// Restore fetch (paste di console):
window.fetch = originalFetch;
```

**Status**: [ ] PASS / [ ] FAIL

---

## Test 6: Slow Network ⏱️

### Setup:
1. [ ] Open Chrome DevTools (F12)
2. [ ] Go to Network tab
3. [ ] Set throttling to "Slow 3G" atau "Fast 3G"

### Steps:
1. [ ] Switch gelombang dengan network throttling aktif

### Expected Results:
- [ ] Loading state terlihat lebih lama (bagus untuk UX testing)
- [ ] User tidak bisa double-click (disabled)
- [ ] Spinner tetap muncul sampai response diterima
- [ ] Setelah response diterima, UI update dengan benar
- [ ] No timeout error

### Cleanup:
- [ ] Set throttling back to "No throttling"

**Status**: [ ] PASS / [ ] FAIL

---

## Test 7: Tab Switching During Load ⚡

### Steps:
1. [ ] Klik "Jadikan Aktif"
2. [ ] Confirm
3. [ ] Saat loading (container semi-transparan), klik tab lain (misal "Pendaftar")
4. [ ] Tunggu 2-3 detik
5. [ ] Klik kembali ke tab "Kelola Gelombang"

### Expected Results:
- [ ] API call tetap jalan di background
- [ ] Saat kembali ke tab Gelombang, data sudah ter-update
- [ ] No stuck loading state

**Status**: [ ] PASS / [ ] FAIL

---

## Test 8: Console Logging Quality 📊

### Check Console Output:
- [ ] Logs menggunakan format `[GELOMBANG]` prefix
- [ ] Step-by-step process clearly logged (Step 1, 2, 3, 4, 5)
- [ ] Success marked with ✅
- [ ] Errors marked with ❌
- [ ] Separator lines (====) untuk readability
- [ ] Data details (payload, response) logged
- [ ] Active count verified di setiap refresh

**Status**: [ ] PASS / [ ] FAIL

---

## Test 9: UI Consistency 🎨

### Visual Checks:
- [ ] Badge "AKTIF" berwarna hijau (bg-success)
- [ ] Badge "Ditutup" berwarna abu-abu (bg-secondary)
- [ ] Border card aktif berwarna hijau (border-success)
- [ ] Border card tidak aktif berwarna abu-abu (border-secondary)
- [ ] Tombol "Aktif Sekarang" disabled dengan style yang jelas
- [ ] Tombol "Jadikan Aktif" hijau dan clickable
- [ ] Layout tidak broken setelah refresh
- [ ] No duplicate cards

**Status**: [ ] PASS / [ ] FAIL

---

## Test 10: Data Accuracy 📍

### Database Verification:
1. [ ] Switch gelombang via UI
2. [ ] Check database langsung:
```sql
SELECT id, nama, is_active FROM gelombang ORDER BY id;
```

### Expected Results:
- [ ] Hanya 1 row dengan `is_active = true`
- [ ] Semua row lain `is_active = false`
- [ ] ID gelombang yang aktif sesuai dengan UI

**Status**: [ ] PASS / [ ] FAIL

---

## Test 11: Notification System 🔔

### If Toastr Library Available:
- [ ] Success notification: Green toast, auto-dismiss
- [ ] Error notification: Red toast, stays longer
- [ ] Text: "Gelombang X berhasil diaktifkan!"

### If No Toastr (Fallback Alert):
- [ ] Success alert: "✅ Gelombang X berhasil diaktifkan!"
- [ ] Error alert: "❌ Gagal mengaktifkan gelombang: [error message]"

**Status**: [ ] PASS / [ ] FAIL

---

## Final Verification ✅

### Overall System Check:
- [ ] No JavaScript errors in console
- [ ] No HTTP 500/400 errors in Network tab
- [ ] Page tidak pernah reload secara penuh
- [ ] User experience smooth & responsive
- [ ] Data selalu akurat dengan database
- [ ] Loading states jelas & informatif
- [ ] Error handling works properly

---

## Test Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Basic Switch | [ ] PASS / [ ] FAIL | |
| 2. Cancel Confirmation | [ ] PASS / [ ] FAIL | |
| 3. Multiple Switches | [ ] PASS / [ ] FAIL | |
| 4. Prevent Double Click | [ ] PASS / [ ] FAIL | |
| 5. Error Recovery | [ ] PASS / [ ] FAIL | |
| 6. Slow Network | [ ] PASS / [ ] FAIL | |
| 7. Tab Switching | [ ] PASS / [ ] FAIL | |
| 8. Console Logging | [ ] PASS / [ ] FAIL | |
| 9. UI Consistency | [ ] PASS / [ ] FAIL | |
| 10. Data Accuracy | [ ] PASS / [ ] FAIL | |
| 11. Notification | [ ] PASS / [ ] FAIL | |

**Overall Result**: [ ] ALL PASS ✅ / [ ] NEEDS FIX ⚠️

---

## Issues Found (If Any)

### Issue #1
- **Description**: ____________________________________
- **Steps to Reproduce**: ____________________________________
- **Expected**: ____________________________________
- **Actual**: ____________________________________
- **Severity**: [ ] Critical / [ ] Major / [ ] Minor
- **Screenshot/Log**: ____________________________________

### Issue #2
- **Description**: ____________________________________
- **Steps to Reproduce**: ____________________________________
- **Expected**: ____________________________________
- **Actual**: ____________________________________
- **Severity**: [ ] Critical / [ ] Major / [ ] Minor
- **Screenshot/Log**: ____________________________________

---

## Sign Off

- **Tester Name**: ____________________
- **Date**: ____________________
- **Browser**: [ ] Chrome [ ] Firefox [ ] Safari [ ] Edge
- **Version**: ____________________
- **Environment**: [ ] Local [ ] Staging [ ] Production
- **Result**: [ ] APPROVED FOR DEPLOYMENT [ ] NEEDS REVISION

**Additional Notes**:
___________________________________________
___________________________________________
___________________________________________

---

## Quick Debug Commands

### Reset Container (if stuck):
```javascript
const c = document.getElementById('gelombangContainer');
c.style.opacity = '1';
c.style.pointerEvents = 'auto';
```

### Force Reload Gelombang Data:
```javascript
loadGelombangData(true);
```

### Check Active Gelombang:
```javascript
fetch('/api/gelombang_active')
  .then(r => r.json())
  .then(d => console.log('Active:', d));
```

### Manual API Test:
```javascript
fetch('/api/set_gelombang_active', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({id: 2})
}).then(r => r.json()).then(console.log);
```

