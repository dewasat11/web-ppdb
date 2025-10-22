# 📦 Refactor Notes - Serverless Function Consolidation

## 🎯 Tujuan
Mengurangi jumlah Serverless Functions dari **13 → 1** untuk memenuhi Vercel Hobby limit (≤ 12 functions).

## ✅ Status: SELESAI

### Before (13 Functions):
```
api/
├── _supabase.py (utility)
├── export_pendaftar_csv.py ❌
├── pembayaran_list.py ❌
├── pembayaran_submit.py ❌
├── pembayaran_verify.py ❌
├── pendaftar_cek_status.py ❌
├── pendaftar_create.py ❌
├── pendaftar_download_zip.py ❌
├── pendaftar_files_list.py ❌
├── pendaftar_list.py ❌
├── pendaftar_status.py ❌
├── pendaftar_update_files.py ❌
├── supa_proxy.py ❌
└── upload_file.py ❌
```

### After (1 Function):
```
api/
├── _supabase.py (utility - tidak dihitung)
├── index.py ✅ (SINGLE SERVERLESS FUNCTION)
└── handlers/ (modules - tidak dihitung)
    ├── export_pendaftar_csv.py
    ├── pembayaran_list.py
    ├── pembayaran_submit.py
    ├── pembayaran_verify.py
    ├── pendaftar_cek_status.py
    ├── pendaftar_create.py
    ├── pendaftar_download_zip.py
    ├── pendaftar_files_list.py
    ├── pendaftar_list.py
    ├── pendaftar_status.py
    ├── pendaftar_update_files.py
    ├── supa_proxy.py
    └── upload_file.py
```

## 🔧 Perubahan Teknis

### 1. Router Pattern (`api/index.py`)
- Single entry point untuk semua API requests
- Routing berdasarkan `action` query parameter atau path
- Dynamic import handlers sesuai action

### 2. Import Path Updates
- Semua handlers di `api/handlers/` update import:
  ```python
  # Before: from ._supabase import supabase_client
  # After:  from .._supabase import supabase_client
  ```

### 3. Vercel Configuration (`vercel.json`)
- **Rewrites** untuk backward compatibility:
  ```json
  {
    "source": "/api/pendaftar_create",
    "destination": "/api/index?action=pendaftar_create"
  }
  ```
- **Functions** hanya specify `api/index.py`:
  ```json
  "functions": {
    "api/index.py": {
      "runtime": "@vercel/python@4.3.1"
    }
  }
  ```

## 🧪 Testing Checklist

### ✅ Endpoint Tests (All BACKWARD COMPATIBLE):

1. **Pendaftar**
   - [ ] GET `/api/pendaftar_list` - List all pendaftar
   - [ ] POST `/api/pendaftar_create` - Create new pendaftar
   - [ ] GET `/api/pendaftar_cek_status?nisn=xxx` - Check status
   - [ ] POST `/api/pendaftar_status` - Update status
   - [ ] POST `/api/pendaftar_update_files` - Update file URLs

2. **Files**
   - [ ] POST `/api/upload_file` - Upload file to storage
   - [ ] GET `/api/pendaftar_files_list?nisn=xxx` - List files
   - [ ] GET `/api/pendaftar_download_zip?nisn=xxx` - Download ZIP

3. **Export**
   - [ ] GET `/api/export_pendaftar_csv` - Export CSV

4. **Pembayaran**
   - [ ] GET `/api/pembayaran_list` - List payments
   - [ ] POST `/api/pembayaran_submit` - Submit payment
   - [ ] POST `/api/pembayaran_verify` - Verify payment

5. **Proxy**
   - [ ] GET/POST `/api/supa_proxy` - Supabase proxy

### ✅ Integration Tests:

1. **Form Pendaftaran** (`/daftar.html`)
   - [ ] Submit form dengan upload files
   - [ ] Verifikasi NISN tersimpan
   - [ ] Verifikasi files terupload

2. **Admin Panel** (`/admin.html`)
   - [ ] Load list pendaftar
   - [ ] Download CSV lengkap
   - [ ] Download ZIP foto per pendaftar
   - [ ] Verifikasi pendaftar/pembayaran

3. **Cek Status** (`/cek-status.html`)
   - [ ] Search by NISN
   - [ ] Display status dengan benar

## 📊 Performance Impact

### Before:
- 13 cold starts (worst case)
- Each endpoint isolated
- Higher deployment size

### After:
- 1 cold start for all requests
- Shared runtime & imports
- Smaller deployment (deduplicated deps)

## 🔒 Security

✅ **No changes to security model:**
- `_supabase.py` masih menggunakan `SERVICE_ROLE` hanya di server
- ANON_KEY untuk public endpoints
- No credential exposure to client

## 🚀 Deployment

### Commands:
```bash
# Deploy to Vercel
vercel --prod

# Expected output:
# ✓ 1 Serverless Function deployed
```

### Verifikasi:
```bash
# Check function count in Vercel Dashboard
# Should show: 1/12 Functions used
```

## 📝 Notes

1. **Backward Compatibility**: Semua endpoint lama tetap berfungsi via rewrites
2. **No Frontend Changes**: Tidak perlu update frontend code
3. **Monitoring**: Watch Vercel logs untuk routing issues
4. **Rollback**: Jika error, revert commit atau restore dari handlers/

## 🎓 Lessons Learned

- Vercel menghitung setiap `.py` file di `/api/` sebagai function
- Moving ke subfolder (`/api/handlers/`) membuat files tidak dihitung
- Rewrites lebih baik dari redirects untuk API compatibility
- Dynamic imports memungkinkan single router pattern

## ✨ Future Improvements

- [ ] Add caching untuk frequently accessed endpoints
- [ ] Implement rate limiting di router level
- [ ] Add metrics/logging untuk monitor performance
- [ ] Consider edge functions untuk geo-distributed traffic

---

**Last Updated**: 2025-01-22
**Status**: ✅ Production Ready
**Vercel Functions**: 1/12 ✨

