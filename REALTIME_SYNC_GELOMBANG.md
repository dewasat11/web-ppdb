# 🔄 Real-Time Sync Gelombang Pendaftaran PPDSB

## 📚 Pondok Pesantren Al Ikhsan Beji

Dokumentasi sistem real-time sync untuk gelombang pendaftaran santri baru.

## ✅ Fitur yang Sudah Diperbaiki

### 1. **Instant UI Update di Admin Panel**
Ketika admin klik **"Jadikan Aktif"** pada gelombang:
- ✅ Button **langsung berubah** menjadi "Gelombang Aktif" (TANPA DELAY)
- ✅ Border card berubah menjadi hijau (success)
- ✅ Badge status berubah menjadi "Aktif"
- ✅ Gelombang lain otomatis kembali ke status "Ditutup"
- ✅ Animasi pulse untuk visual feedback

### 2. **Real-Time Sync dengan Halaman Publik (index.html)**
Perubahan status gelombang di admin panel akan **otomatis tersinkronisasi** dengan halaman publik:

#### **Mekanisme Sync:**
1. **LocalStorage Event** (same browser, cross-tab)
   - Admin panel broadcast update via `localStorage.setItem('gelombang_update')`
   - Halaman publik listening via `window.addEventListener('storage')`
   - Update muncul dalam **~300ms**

2. **Supabase Real-Time** (cross-device, cross-browser)
   - Admin panel update database via Supabase RPC
   - Supabase broadcast ke semua connected clients
   - Halaman publik auto-reload dalam **~500ms**

### 3. **Multi-Tab Admin Sync**
Jika ada beberapa tab admin terbuka:
- ✅ Semua tab admin otomatis sinkron via Supabase real-time
- ✅ Toast notification muncul: "Data gelombang diperbarui dari sumber lain"
- ✅ Data reload otomatis tanpa perlu refresh manual

---

## 🚀 Cara Kerja

### **Di Admin Panel (`admin.html`)**

#### 1. Klik "Jadikan Aktif"
```javascript
setGelombangActive(id)
```

#### 2. Instant UI Update (Optimistic Update)
```javascript
// Button langsung berubah SEBELUM API call
targetButton.outerHTML = `
  <button disabled>
    <i class="bi bi-check-circle-fill"></i> Gelombang Aktif
  </button>
`;
```

#### 3. API Call ke Supabase
```javascript
await window.supabase.rpc('set_gelombang_status', { p_id: id });
```

#### 4. Broadcast Update
```javascript
// LocalStorage (untuk same-browser sync)
localStorage.setItem('gelombang_update', JSON.stringify({
  timestamp: Date.now(),
  activeId: id,
  action: 'gelombang_activated'
}));

// Manual dispatch (untuk same-tab sync)
window.dispatchEvent(new StorageEvent('storage', {
  key: 'gelombang_update',
  newValue: JSON.stringify(updatePayload)
}));
```

---

### **Di Halaman Publik (`index.html`)**

#### 1. Listen LocalStorage Event
```javascript
window.addEventListener('storage', function(e) {
  if (e.key === 'gelombang_update') {
    const update = JSON.parse(e.newValue);
    console.log('Received update from admin:', update);
    
    // Reload gelombang display
    setTimeout(() => {
      loadGelombangAktif();
    }, 300);
  }
});
```

#### 2. Listen Supabase Real-Time
```javascript
window.supabase
  .channel('gelombang-changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'gelombang' 
  }, (payload) => {
    console.log('Gelombang data changed:', payload);
    
    setTimeout(() => {
      loadGelombangAktif();
    }, 500);
  })
  .subscribe();
```

---

## 📊 Timeline Update

| Aksi | Admin Panel | Halaman Publik (Same Browser) | Halaman Publik (Different Device) |
|------|-------------|-------------------------------|-----------------------------------|
| Klik "Jadikan Aktif" | **Instant** (0ms) | - | - |
| Button berubah | **Instant** (0ms) | - | - |
| LocalStorage broadcast | ~50ms | **~300ms** | - |
| Supabase RPC call | ~200-500ms | - | - |
| Supabase real-time | - | ~500-1000ms | **~500-1000ms** |

---

## 🎯 Keuntungan

### **UX yang Lebih Baik**
- ✅ No loading spinner yang lama
- ✅ Instant feedback untuk admin
- ✅ Smooth animation
- ✅ Toast notification yang informatif

### **Data Consistency**
- ✅ Optimistic update dengan rollback on error
- ✅ Background refresh untuk consistency
- ✅ Multi-tab sync otomatis

### **Real-Time untuk Pengunjung**
- ✅ Pengunjung website langsung lihat gelombang terbaru
- ✅ Tidak perlu refresh manual
- ✅ Cross-device sync via Supabase

---

## 🧪 Testing

### **Test 1: Admin Panel - Instant Update**
1. Buka admin panel → tab "Kelola Gelombang"
2. Klik "Jadikan Aktif" pada Gelombang 2
3. **Hasil:** Button langsung berubah menjadi "Gelombang Aktif" (instant)
4. **Hasil:** Card border berubah hijau, badge menjadi "Aktif"
5. **Hasil:** Gelombang lain button kembali menjadi "Jadikan Aktif"

### **Test 2: Cross-Tab Sync (Same Browser)**
1. Buka 2 tab: Tab A = Admin, Tab B = Index (public page)
2. Di Tab A, aktifkan Gelombang 2
3. **Hasil:** Tab B otomatis reload dalam ~300ms
4. **Hasil:** Card Gelombang 2 di Tab B berubah status menjadi "Pendaftaran Dibuka"

### **Test 3: Multi-Tab Admin**
1. Buka 2 tab admin (Tab A & Tab B)
2. Di Tab A, aktifkan Gelombang 3
3. **Hasil:** Tab B menerima notifikasi "Data gelombang diperbarui"
4. **Hasil:** Tab B auto-reload dan show Gelombang 3 sebagai aktif

### **Test 4: Cross-Device Sync**
1. Device A: Admin panel di laptop
2. Device B: Website publik di smartphone
3. Di Device A, aktifkan Gelombang 1
4. **Hasil:** Device B auto-update dalam ~500ms (via Supabase real-time)

---

## 🔧 Technical Details

### **Technologies Used**
- **Supabase Real-Time**: WebSocket-based real-time sync
- **LocalStorage Event**: Cross-tab communication (same browser)
- **Optimistic UI Update**: Instant feedback before API response
- **Toast Notifications**: User-friendly feedback (Toastr.js)

### **Error Handling**
```javascript
try {
  // Optimistic update
  updateUIInstantly();
  
  // API call
  await supabase.rpc('set_gelombang_status');
  
  // Success
  showSuccessToast();
} catch (error) {
  // Rollback UI on error
  await loadGelombangData(true);
  showErrorToast(error.message);
}
```

---

## 📝 Notes

1. **LocalStorage** hanya bekerja untuk same-browser (cross-tab)
2. **Supabase Real-Time** bekerja untuk cross-device/cross-browser
3. **Optimistic Update** memberikan instant feedback, tapi bisa rollback jika error
4. **Background Refresh** (1 detik setelah aktivasi) memastikan data consistency

---

## 🐛 Troubleshooting

### **Problem: Update tidak muncul di halaman publik**
**Solusi:**
1. Check browser console untuk error Supabase
2. Pastikan Supabase credentials valid
3. Check network tab untuk WebSocket connection
4. Coba refresh manual (Ctrl+F5)

### **Problem: Button tidak langsung berubah**
**Solusi:**
1. Check browser console untuk JavaScript error
2. Pastikan `admin.js` sudah di-load
3. Clear browser cache

### **Problem: Multi-tab tidak sync**
**Solusi:**
1. Check Supabase real-time status di console
2. Pastikan table `gelombang` sudah enable real-time di Supabase dashboard
3. Check RLS policies untuk real-time

---

## ✨ Future Improvements (Optional)

1. **WebSocket Status Indicator**: Show online/offline status
2. **Conflict Resolution**: Handle concurrent edits from multiple admins
3. **Audit Log**: Track who activated which gelombang and when
4. **Push Notifications**: Notify via browser notification API

---

## 🏫 **Pondok Pesantren Al Ikhsan Beji**

**Created:** 2025-01-24  
**Last Updated:** 2025-01-24  
**Version:** 1.0  
**Project:** PPDSB (Penerimaan Peserta Didik dan Santri Baru)

