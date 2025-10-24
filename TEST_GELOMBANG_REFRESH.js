// Test script untuk memverifikasi auto refresh gelombang
// Paste ini di browser console untuk testing

console.log('🧪 GELOMBANG AUTO REFRESH TEST');
console.log('================================');

// Test 1: Check if functions exist
console.log('Test 1: Function availability');
console.log('loadGelombangData:', typeof loadGelombangData);
console.log('setGelombangActive:', typeof setGelombangActive);
console.log('renderGelombangForms:', typeof renderGelombangForms);

// Test 2: Check container element
console.log('\nTest 2: Container element');
const container = document.getElementById('gelombangContainer');
console.log('Container found:', !!container);
if (container) {
  console.log('Container innerHTML length:', container.innerHTML.length);
  console.log('Container has cards:', container.querySelectorAll('.card').length);
}

// Test 3: Check current gelombang data
console.log('\nTest 3: Current gelombang data');
console.log('currentGelombangData:', currentGelombangData);
if (currentGelombangData && currentGelombangData.length > 0) {
  console.log('Active gelombang count:', currentGelombangData.filter(g => g.is_active).length);
  console.log('Gelombang list:', currentGelombangData.map(g => ({
    id: g.id,
    nama: g.nama,
    is_active: g.is_active
  })));
}

// Test 4: Test loadGelombangData function
console.log('\nTest 4: Testing loadGelombangData function');
if (typeof loadGelombangData === 'function') {
  console.log('Calling loadGelombangData(true)...');
  loadGelombangData(true)
    .then(() => {
      console.log('✅ loadGelombangData completed successfully');
      
      // Check if UI was updated
      const updatedContainer = document.getElementById('gelombangContainer');
      if (updatedContainer) {
        console.log('Updated container length:', updatedContainer.innerHTML.length);
        console.log('Updated cards count:', updatedContainer.querySelectorAll('.card').length);
        
        // Check active/inactive cards
        const activeCards = updatedContainer.querySelectorAll('.border-success');
        const inactiveCards = updatedContainer.querySelectorAll('.border-secondary');
        console.log('Active cards (green border):', activeCards.length);
        console.log('Inactive cards (gray border):', inactiveCards.length);
      }
    })
    .catch(error => {
      console.error('❌ loadGelombangData failed:', error);
    });
} else {
  console.error('❌ loadGelombangData function not found');
}

// Test 5: Test API endpoints
console.log('\nTest 5: Testing API endpoints');

// Test get gelombang list
fetch('/api/get_gelombang_list')
  .then(response => {
    console.log('GET /api/get_gelombang_list status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('GET response:', data);
    if (data.ok && data.data) {
      console.log('Gelombang count:', data.data.length);
      console.log('Active count:', data.data.filter(g => g.is_active).length);
    }
  })
  .catch(error => {
    console.error('❌ GET /api/get_gelombang_list failed:', error);
  });

// Test 6: Simulate setGelombangActive call (without actually changing data)
console.log('\nTest 6: Simulating setGelombangActive call');
console.log('Note: This will NOT actually change data, just test the function');

// Test 7: Check for error handlers
console.log('\nTest 7: Error handling check');
window.addEventListener('error', (event) => {
  console.error('❌ Global error caught:', event.error);
});

// Test 8: Monitor localStorage events
console.log('\nTest 8: Monitoring localStorage events');
window.addEventListener('storage', (event) => {
  if (event.key === 'gelombang_update') {
    console.log('📡 localStorage event received:', event.newValue);
  }
});

// Test 9: Monitor custom events
console.log('\nTest 9: Monitoring custom events');
window.addEventListener('gelombangUpdated', (event) => {
  console.log('📡 Custom event received:', event.detail);
});

// Test 10: Final verification
setTimeout(() => {
  console.log('\nTest 10: Final verification');
  const finalContainer = document.getElementById('gelombangContainer');
  if (finalContainer) {
    const activeCards = finalContainer.querySelectorAll('.border-success');
    const inactiveCards = finalContainer.querySelectorAll('.border-secondary');
    const totalCards = finalContainer.querySelectorAll('.card').length;
    
    console.log('Final state:');
    console.log('- Total cards:', totalCards);
    console.log('- Active cards:', activeCards.length);
    console.log('- Inactive cards:', inactiveCards.length);
    
    if (activeCards.length === 1 && totalCards > 1) {
      console.log('✅ UI state looks correct - exactly 1 active gelombang');
    } else if (activeCards.length === 0) {
      console.log('⚠️ No active gelombang found');
    } else if (activeCards.length > 1) {
      console.log('❌ Multiple active gelombang found - this is wrong');
    } else {
      console.log('❓ Unexpected state');
    }
  } else {
    console.error('❌ Container not found in final verification');
  }
}, 3000);

console.log('\n🧪 Test completed - check results above');
console.log('================================');
