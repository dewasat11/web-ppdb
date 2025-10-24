// Test script untuk memverifikasi statistik menggunakan SEMUA pendaftar
// Paste ini di browser console untuk testing

console.log('🧪 STATISTIK ALL PENDAFTAR TEST');
console.log('================================');

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

console.log('Current statistics values:');
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
      console.log('Total pendaftar:', data.data.length);
      console.log('Sample pendaftar:', data.data[0]);
      
      // Check field mapping
      if (data.data.length > 0) {
        const sample = data.data[0];
        console.log('Sample fields:', Object.keys(sample));
        console.log('Sample status:', sample.status);
        console.log('Sample rencana_program:', sample.rencana_program);
        console.log('Sample rencanatingkat:', sample.rencanatingkat);
        console.log('Sample jeniskelamin:', sample.jeniskelamin);
        
        // Manual statistics calculation
        console.log('\nManual statistics calculation:');
        
        // Status breakdown
        const statusCounts = {};
        data.data.forEach(d => {
          const status = d.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log('Status breakdown:', statusCounts);
        
        // Program breakdown
        const programCounts = {};
        data.data.forEach(d => {
          const program = d.rencana_program || d.rencanaprogram || 'unknown';
          programCounts[program] = (programCounts[program] || 0) + 1;
        });
        console.log('Program breakdown:', programCounts);
        
        // Jenjang breakdown
        const jenjangCounts = {};
        data.data.forEach(d => {
          const jenjang = d.rencanatingkat || 'unknown';
          jenjangCounts[jenjang] = (jenjangCounts[jenjang] || 0) + 1;
        });
        console.log('Jenjang breakdown:', jenjangCounts);
        
        // Gender breakdown
        const genderCounts = {};
        data.data.forEach(d => {
          const gender = d.jeniskelamin || 'unknown';
          genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        });
        console.log('Gender breakdown:', genderCounts);
        
        // Detailed breakdown calculation
        console.log('\nDetailed breakdown calculation:');
        
        const getRencanaProgram = (d) => d.rencana_program || d.rencanaprogram || "";
        const getJenjang = (d) => d.rencanatingkat || "";
        
        const putraIndukMts = data.data.filter(d => 
          getRencanaProgram(d) === "Pondok Putra Induk" && getJenjang(d) === "MTs"
        ).length;
        const putraIndukMa = data.data.filter(d => 
          getRencanaProgram(d) === "Pondok Putra Induk" && getJenjang(d) === "MA"
        ).length;
        const putraIndukKuliah = data.data.filter(d => 
          getRencanaProgram(d) === "Pondok Putra Induk" && getJenjang(d) === "Kuliah"
        ).length;
        
        const putraTahfidzMts = data.data.filter(d => 
          getRencanaProgram(d) === "Pondok Putra Tahfidz" && getJenjang(d) === "MTs"
        ).length;
        const putraTahfidzMa = data.data.filter(d => 
          getRencanaProgram(d) === "Pondok Putra Tahfidz" && getJenjang(d) === "MA"
        ).length;
        const putraTahfidzKuliah = data.data.filter(d => 
          getRencanaProgram(d) === "Pondok Putra Tahfidz" && getJenjang(d) === "Kuliah"
        ).length;
        
        const putriMts = data.data.filter(d => 
          getRencanaProgram(d) === "Pondok Putri" && getJenjang(d) === "MTs"
        ).length;
        const putriMa = data.data.filter(d => 
          getRencanaProgram(d) === "Pondok Putri" && getJenjang(d) === "MA"
        ).length;
        const putriKuliah = data.data.filter(d => 
          getRencanaProgram(d) === "Pondok Putri" && getJenjang(d) === "Kuliah"
        ).length;
        
        const hanyaSekolahMtsL = data.data.filter(d => 
          getRencanaProgram(d) === "Hanya Sekolah" && 
          getJenjang(d) === "MTs" && 
          (d.jeniskelamin === "L" || d.jenisKelamin === "L")
        ).length;
        const hanyaSekolahMtsP = data.data.filter(d => 
          getRencanaProgram(d) === "Hanya Sekolah" && 
          getJenjang(d) === "MTs" && 
          (d.jeniskelamin === "P" || d.jenisKelamin === "P")
        ).length;
        const hanyaSekolahMaL = data.data.filter(d => 
          getRencanaProgram(d) === "Hanya Sekolah" && 
          getJenjang(d) === "MA" && 
          (d.jeniskelamin === "L" || d.jenisKelamin === "L")
        ).length;
        const hanyaSekolahMaP = data.data.filter(d => 
          getRencanaProgram(d) === "Hanya Sekolah" && 
          getJenjang(d) === "MA" && 
          (d.jeniskelamin === "P" || d.jenisKelamin === "P")
        ).length;
        
        console.log('Pondok Putra Induk:', { MTs: putraIndukMts, MA: putraIndukMa, Kuliah: putraIndukKuliah });
        console.log('Pondok Putra Tahfidz:', { MTs: putraTahfidzMts, MA: putraTahfidzMa, Kuliah: putraTahfidzKuliah });
        console.log('Pondok Putri:', { MTs: putriMts, MA: putriMa, Kuliah: putriKuliah });
        console.log('Hanya Sekolah:', { 
          MTs_L: hanyaSekolahMtsL, 
          MTs_P: hanyaSekolahMtsP, 
          MA_L: hanyaSekolahMaL, 
          MA_P: hanyaSekolahMaP 
        });
      }
    }
  })
  .catch(error => {
    console.error('❌ Pendaftar API failed:', error);
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
        
        // Verify no zeros
        const hasZeros = statistikElements.some(id => {
          const el = document.getElementById(id);
          return el && el.textContent === '0';
        });
        
        if (hasZeros) {
          console.log('⚠️ Some statistics still show 0 - check data or field mapping');
        } else {
          console.log('✅ All statistics show non-zero values');
        }
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

console.log('\n🧪 Test completed - check results above');
console.log('================================');
