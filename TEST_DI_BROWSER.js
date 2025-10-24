// ============================================================
// 🧪 SCRIPT TESTING DI BROWSER CONSOLE
// ============================================================
// CARA PAKAI:
// 1. Buka admin.html
// 2. Tekan F12 untuk buka Console
// 3. Copy SEMUA script ini
// 4. Paste di Console
// 5. Tekan Enter
// 6. Lihat hasilnya dan screenshot!
// ============================================================

console.log('🧪 ========== GELOMBANG DIAGNOSTIC TEST ==========');

// TEST 1: Cek apakah toastr tersedia
console.log('\n📋 TEST 1: Cek Toastr Library');
if (typeof toastr !== 'undefined') {
  console.log('✅ Toastr tersedia!');
  console.log('   Version:', toastr.version || 'unknown');
  
  // Test toastr hijau
  toastr.success('Test notifikasi HIJAU berhasil!', 'Test Success');
  console.log('   → Cek pojok kanan atas, harus ada notifikasi HIJAU!');
} else {
  console.error('❌ Toastr TIDAK tersedia!');
  console.error('   → CDN toastr gagal load atau blocked');
}

// TEST 2: Test API call langsung
console.log('\n📋 TEST 2: Test API Call Langsung');
console.log('   Mengirim request ke /api/set_gelombang_active dengan ID=1...');

fetch('/api/set_gelombang_active', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ id: 1 })
})
.then(response => {
  console.log('   ✅ Response received!');
  console.log('   Status:', response.status, response.statusText);
  
  if (response.status === 500) {
    console.error('   ❌ MASALAH: Server mengembalikan HTTP 500!');
    console.error('   → Backend masih error! SQL function belum fix!');
  } else if (response.status === 200) {
    console.log('   ✅ Status 200 OK! Backend berhasil!');
  }
  
  return response.json();
})
.then(data => {
  console.log('   Response data:', data);
  
  if (data.ok === true) {
    console.log('   ✅ SUCCESS! data.ok = true');
    console.log('   → Backend berhasil aktivasi gelombang!');
    
    // Show green notification
    if (typeof toastr !== 'undefined') {
      toastr.success(data.message || 'Test berhasil!', 'Success');
    }
  } else {
    console.error('   ❌ MASALAH: data.ok = false');
    console.error('   Error:', data.error || data.message);
    
    // Show red notification
    if (typeof toastr !== 'undefined') {
      toastr.error(data.error || data.message || 'Test gagal', 'Error');
    }
  }
})
.catch(error => {
  console.error('   ❌ ERROR during fetch:', error);
  console.error('   Error message:', error.message);
  
  if (typeof toastr !== 'undefined') {
    toastr.error('Network error: ' + error.message, 'Gagal');
  }
});

// TEST 3: Cek gelombang data
console.log('\n📋 TEST 3: Cek Data Gelombang Aktif');
setTimeout(() => {
  fetch('/api/get_gelombang_list')
    .then(r => r.json())
    .then(data => {
      console.log('   Gelombang list:', data.data);
      
      const activeGelombang = data.data.filter(g => g.is_active);
      console.log('   Gelombang aktif:', activeGelombang);
      
      if (activeGelombang.length === 1) {
        console.log('   ✅ Hanya 1 gelombang aktif (benar!)');
        console.log('   → Active:', activeGelombang[0].nama, '(ID:', activeGelombang[0].id + ')');
      } else if (activeGelombang.length > 1) {
        console.error('   ❌ MASALAH: Ada', activeGelombang.length, 'gelombang aktif!');
        console.error('   → Seharusnya hanya 1!');
      } else {
        console.warn('   ⚠️ WARNING: Tidak ada gelombang aktif!');
      }
    })
    .catch(err => {
      console.error('   ❌ Error fetching gelombang:', err);
    });
}, 2000);

console.log('\n🧪 ========== TEST SELESAI ==========');
console.log('📸 SCREENSHOT hasil di atas dan kirim!');
console.log('\n💡 Yang harus dicek:');
console.log('   1. Apakah toastr tersedia? (✅ atau ❌)');
console.log('   2. Apakah ada notifikasi HIJAU muncul di pojok kanan atas?');
console.log('   3. Apakah response status 200 atau 500?');
console.log('   4. Apakah data.ok = true atau false?');
console.log('   5. Apakah hanya 1 gelombang aktif?');

