#!/bin/bash

# ═══════════════════════════════════════════════════════
#  🧪 POST-DEPLOYMENT SMOKE TESTS
#  Test all 13 endpoints via rewrites
# ═══════════════════════════════════════════════════════

# Replace with your actual domain after deployment
DOMAIN="${1:-https://ppdb-smp.vercel.app}"

echo "════════════════════════════════════════════════════════"
echo "  🧪 SMOKE TESTS - Vercel Deployment"
echo "  Domain: $DOMAIN"
echo "════════════════════════════════════════════════════════"
echo ""

# Test function
test_endpoint() {
  local name="$1"
  local url="$2"
  local method="${3:-GET}"
  local data="$4"
  
  echo -n "Testing $name... "
  
  if [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$DOMAIN$url" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null)
  else
    response=$(curl -s -w "\n%{http_code}" "$DOMAIN$url" 2>/dev/null)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed \$d)
  
  if [[ "$http_code" =~ ^(200|201|204)$ ]]; then
    echo "✅ $http_code"
  else
    echo "❌ $http_code"
    echo "   Response: $(echo "$body" | head -c 100)..."
  fi
}

echo "📝 1. PENDAFTAR ENDPOINTS"
test_endpoint "List Pendaftar" "/api/pendaftar_list"
test_endpoint "Cek Status (no NISN)" "/api/pendaftar_cek_status"
test_endpoint "Cek Status (with NISN)" "/api/pendaftar_cek_status?nisn=1234567890"
test_endpoint "Files List" "/api/pendaftar_files_list?nisn=1234567890"
test_endpoint "Download ZIP" "/api/pendaftar_download_zip?nisn=1234567890"
test_endpoint "Export CSV" "/api/export_pendaftar_csv"

echo ""
echo "💰 2. PEMBAYARAN ENDPOINTS"
test_endpoint "Pembayaran List" "/api/pembayaran_list"

echo ""
echo "📄 3. STATIC PAGES"
test_endpoint "Homepage" "/"
test_endpoint "Daftar Page" "/daftar"
test_endpoint "Admin Page" "/admin"
test_endpoint "Cek Status Page" "/cek-status"
test_endpoint "Login Page" "/login"

echo ""
echo "🔧 4. PROXY & UPLOAD"
test_endpoint "Supa Proxy" "/api/supa_proxy?table=pendaftar&select=*&limit=1"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ SMOKE TESTS COMPLETED"
echo "════════════════════════════════════════════════════════"
echo ""
echo "💡 To test POST endpoints manually:"
echo "   curl -X POST $DOMAIN/api/pendaftar_create \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"nisn\":\"1234567890\",\"nama\":\"Test\"}'"
echo ""

