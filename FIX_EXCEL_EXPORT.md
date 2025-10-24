# 🔧 Fix: Excel Export File Fields Issue

## Problem Description

**Issue**: Di file download .xlsx, kolom `file_akte` selalu menampilkan "TIDAK" padahal pendaftar sudah upload file akte.

**Root Cause**: Ketidaksesuaian antara field name di database dan header Excel.

## Analysis

### 1. Database Field Names
Di database Supabase, field untuk file akte adalah:
- `file_akta` (bukan `file_akte`)

### 2. Excel Header vs Database Field
**Before (BROKEN)**:
```python
# Database query
file_akta,  # ✅ Correct database field

# Excel header
'file_akte',  # ❌ Wrong header name

# Mapping logic
if header.startswith('file_'):
    boolean_key = 'has_' + header  # 'has_file_akte'
    value = 'YA' if row_data.get(boolean_key, False) else 'TIDAK'
```

**Problem**: 
- Database field: `file_akta` → `has_file_akta`
- Excel header: `file_akte` → `has_file_akte`
- **Mismatch**: `has_file_akta` vs `has_file_akte`

### 3. Data Flow
```
Database: file_akta → has_file_akta (boolean)
Excel Header: file_akte → has_file_akte (lookup)
Result: has_file_akte not found → always TIDAK
```

## Solution Applied

### 1. Fix Excel Header
```python
# Before
'file_akte',  # ❌ Wrong

# After  
'file_akta',  # ✅ Correct - matches database field
```

### 2. Updated Headers Array
```python
headers = [
    'nisn',
    'nama',
    'tanggal_lahir',
    'tempat_lahir',
    'nama_ayah',
    'nama_ibu',
    'nomor_orangtua',
    'rencana_tingkat',
    'rencana_program',
    'alamat_lengkap',
    'file_akta',  # FIXED: was 'file_akte', now matches database
    'file_ijazah',
    'file_foto',
    'file_bpjs'
]
```

### 3. Mapping Logic (Unchanged)
```python
if header.startswith('file_'):
    boolean_key = 'has_' + header  # 'has_file_akta'
    value = 'YA' if row_data.get(boolean_key, False) else 'TIDAK'
```

**Now Works**:
- Database field: `file_akta` → `has_file_akta` (boolean)
- Excel header: `file_akta` → `has_file_akta` (lookup)
- **Match**: `has_file_akta` found → shows YA/TIDAK correctly

## Files Modified

### `lib/handlers/export_pendaftar_xlsx.py`

**Line 131**: Fixed header name
```python
# Before
'file_akte',

# After
'file_akta',  # FIXED: was 'file_akte', should be 'file_akta' to match database
```

## Testing

### Test Case 1: Pendaftar dengan File Akte
**Setup**:
1. Pendaftar upload file akte
2. Database field `file_akta` contains URL
3. Export Excel

**Expected Result**:
- Kolom `file_akta` menampilkan "YA"

### Test Case 2: Pendaftar tanpa File Akte
**Setup**:
1. Pendaftar tidak upload file akte
2. Database field `file_akta` is NULL/empty
3. Export Excel

**Expected Result**:
- Kolom `file_akta` menampilkan "TIDAK"

### Test Case 3: Multiple File Types
**Setup**:
1. Pendaftar upload: akte, ijazah, foto, bpjs
2. Export Excel

**Expected Result**:
- `file_akta`: YA
- `file_ijazah`: YA  
- `file_foto`: YA
- `file_bpjs`: YA

## Verification Steps

### 1. Check Database Fields
```sql
SELECT nisn, namalengkap, file_akta, file_ijazah, file_foto, file_bpjs 
FROM pendaftar 
WHERE file_akta IS NOT NULL 
LIMIT 5;
```

### 2. Test Export API
```bash
curl -X GET "https://your-domain.vercel.app/api/export_pendaftar_xlsx" \
  -H "Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" \
  --output test_export.xlsx
```

### 3. Check Excel Content
1. Open downloaded .xlsx file
2. Check column `file_akta` (not `file_akte`)
3. Verify values: YA/TIDAK (not all TIDAK)

## Related Files

### Database Schema
```sql
-- Table: pendaftar
CREATE TABLE pendaftar (
  id SERIAL PRIMARY KEY,
  nisn VARCHAR(10),
  namalengkap VARCHAR(255),
  file_akta TEXT,      -- ✅ Correct field name
  file_ijazah TEXT,
  file_foto TEXT,
  file_bpjs TEXT,
  -- ... other fields
);
```

### Upload Handler
`lib/handlers/upload_file.py` - Uploads files to storage and updates database
- Field: `file_akta` ✅

### Update Files Handler  
`lib/handlers/pendaftar_update_files.py` - Updates file URLs in database
- Field: `file_akta` ✅

### Files List Handler
`lib/handlers/pendaftar_files_list.py` - Lists uploaded files
- Maps `akta` → "Akta Kelahiran" ✅

## Prevention

### 1. Consistent Naming Convention
- Database fields: `file_akta`, `file_ijazah`, `file_foto`, `file_bpjs`
- Excel headers: Must match database field names exactly
- Boolean keys: `has_file_akta`, `has_file_ijazah`, etc.

### 2. Validation
```python
# Validate header matches database field
database_fields = ['file_akta', 'file_ijazah', 'file_foto', 'file_bpjs']
excel_headers = [h for h in headers if h.startswith('file_')]

for header in excel_headers:
    if header not in database_fields:
        raise ValueError(f"Excel header '{header}' not found in database fields")
```

### 3. Testing Checklist
- [ ] Database field names documented
- [ ] Excel headers match database fields
- [ ] Boolean mapping logic tested
- [ ] Export API tested with real data
- [ ] Excel file content verified

## Impact

### Before Fix
- ❌ All `file_akta` values showed "TIDAK"
- ❌ Inaccurate data in Excel export
- ❌ Admin confusion about file upload status

### After Fix  
- ✅ `file_akta` values show "YA" when file exists
- ✅ `file_akta` values show "TIDAK" when no file
- ✅ Accurate data in Excel export
- ✅ Admin can trust export data

## Deployment Notes

1. **No Database Changes Required** - Field names already correct
2. **No Frontend Changes Required** - Only backend export handler
3. **Backward Compatible** - Existing data unaffected
4. **Immediate Effect** - Next export will show correct data

## Monitoring

### Success Indicators
- Excel exports show correct YA/TIDAK values
- No more "all TIDAK" issue
- Admin reports accurate file status

### Error Indicators  
- Excel still shows all TIDAK
- Export API errors
- Field mapping errors in logs

---

**Status**: ✅ FIXED
**Date**: 2025-10-24  
**Files Changed**: 1 (`export_pendaftar_xlsx.py`)
**Testing**: Ready for deployment

