// Test script untuk debug statistik pendaftar
// Paste ini di browser console untuk testing

console.log('🧪 STATISTIK DEBUG TEST');
console.log('========================');

// Test 1: Check if functions exist
console.log('Test 1: Function availability');
console.log('loadPendaftar:', typeof loadPendaftar);

// Test 2: Check DOM elements
console.log('\nTest 2: DOM elements check');
const statistikElements = [
  'totalCount',
  'pendingCount', 
  'revisiCount',
  'diterimaCount',
  'ditolakCount',
  'putraIndukMts',
  'putraIndukMa',
  'putraIndukKuliah',
  'putraIndukTotal',
  'putraTahfidzMts',
  'putraTahfidzMa', 
  'putraTahfidzKuliah',
  'putraTahfidzTotal',
  'putriMts',
  'putriMa',
  'putriKuliah',
  'putriTotal',
  'hanyaSekolahMtsL',
  'hanyaSekolahMtsP',
  'hanyaSekolahMaL',
  'hanyaSekolahMaP',
  'hanyaSekolahTotal'
];

statistikElements.forEach(id => {
  const el = document.getElementById(id);
  console.log(`${id}:`, el ? el.textContent : 'NOT FOUND');
});

// Test 3: Test API endpoints
console.log('\nTest 3: API endpoints test');

// Test pendaftar_list API
fetch('/api/pendaftar_list')
  .then(response => {
    console.log('GET /api/pendaftar_list status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Pendaftar API response:', data);
    if (data.success && data.data) {
      console.log('Pendaftar count:', data.data.length);
      console.log('Sample pendaftar:', data.data[0]);
      
      // Check field mapping
      if (data.data.length > 0) {
        const sample = data.data[0];
        console.log('Sample fields:', Object.keys(sample));
        console.log('Sample status:', sample.status);
        console.log('Sample rencana_program:', sample.rencana_program);
        console.log('Sample rencanatingkat:', sample.rencanatingkat);
        console.log('Sample jeniskelamin:', sample.jeniskelamin);
      }
    }
  })
  .catch(error => {
    console.error('❌ Pendaftar API failed:', error);
  });

// Test pembayaran_list API
fetch('/api/pembayaran_list')
  .then(response => {
    console.log('GET /api/pembayaran_list status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Pembayaran API response:', data);
    if (data.success && data.data) {
      console.log('Pembayaran count:', data.data.length);
      const verifiedCount = data.data.filter(p => (p.status || '').toUpperCase() === 'VERIFIED').length;
      console.log('Verified payments:', verifiedCount);
    }
  })
  .catch(error => {
    console.error('❌ Pembayaran API failed:', error);
  });

// Test 4: Manual loadPendaftar test
console.log('\nTest 4: Manual loadPendaftar test');
if (typeof loadPendaftar === 'function') {
  console.log('Calling loadPendaftar()...');
  loadPendaftar()
    .then(() => {
      console.log('✅ loadPendaftar completed');
      
      // Check if statistics were updated
      setTimeout(() => {
        console.log('\nFinal statistics check:');
        statistikElements.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            console.log(`${id}: ${el.textContent}`);
          }
        });
      }, 2000);
    })
    .catch(error => {
      console.error('❌ loadPendaftar failed:', error);
    });
} else {
  console.error('❌ loadPendaftar function not found');
}

// Test 5: Check for errors
console.log('\nTest 5: Error monitoring');
window.addEventListener('error', (event) => {
  console.error('❌ Global error caught:', event.error);
});

// Test 6: Manual data analysis
console.log('\nTest 6: Manual data analysis');
setTimeout(() => {
  // Get current pendaftar data
  fetch('/api/pendaftar_list')
    .then(r => r.json())
    .then(result => {
      if (result.success && result.data) {
        console.log('Manual analysis of pendaftar data:');
        console.log('Total pendaftar:', result.data.length);
        
        // Status analysis
        const statusCounts = {};
        result.data.forEach(d => {
          const status = d.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log('Status breakdown:', statusCounts);
        
        // Program analysis
        const programCounts = {};
        result.data.forEach(d => {
          const program = d.rencana_program || d.rencanaprogram || 'unknown';
          programCounts[program] = (programCounts[program] || 0) + 1;
        });
        console.log('Program breakdown:', programCounts);
        
        // Jenjang analysis
        const jenjangCounts = {};
        result.data.forEach(d => {
          const jenjang = d.rencanatingkat || 'unknown';
          jenjangCounts[jenjang] = (jenjangCounts[jenjang] || 0) + 1;
        });
        console.log('Jenjang breakdown:', jenjangCounts);
        
        // Gender analysis
        const genderCounts = {};
        result.data.forEach(d => {
          const gender = d.jeniskelamin || 'unknown';
          genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        });
        console.log('Gender breakdown:', genderCounts);
      }
    })
    .catch(error => {
      console.error('❌ Manual analysis failed:', error);
    });
}, 3000);

console.log('\n🧪 Test completed - check results above');
console.log('========================');
