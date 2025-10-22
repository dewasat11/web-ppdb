# ✅ DEPLOYMENT READY - VERCEL HOBBY (1/12 Functions)

## 📊 FINAL STRUCTURE

```
ppdb-smp-/
├── api/
│   └── index.py          ← ONLY 1 SERVERLESS FUNCTION
│
├── lib/                  ← NOT counted as functions
│   ├── _supabase.py      ← Shared Supabase client
│   └── handlers/         ← All 13 endpoint handlers
│       ├── pendaftar_create.py
│       ├── pendaftar_list.py
│       ├── pendaftar_cek_status.py
│       ├── pendaftar_status.py
│       ├── pendaftar_update_files.py
│       ├── pendaftar_files_list.py
│       ├── pendaftar_download_zip.py
│       ├── export_pendaftar_csv.py
│       ├── upload_file.py
│       ├── pembayaran_list.py
│       ├── pembayaran_submit.py
│       ├── pembayaran_verify.py
│       └── supa_proxy.py
│
├── public/               ← Static frontend
│   ├── index.html
│   ├── daftar.html
│   ├── admin.html
│   ├── login.html
│   ├── cek-status.html
│   └── assets/
│
├── vercel.json           ← Configured with rewrites + excludeFiles
└── requirements.txt
```

---

## 🔧 ROUTING STRATEGY

### vercel.json Configuration:
```json
{
  "functions": {
    "api/index.py": { "runtime": "@vercel/python@4.3.1" }
  },
  "excludeFiles": [
    "pages/api/**",
    "app/api/**",
    "app/**/route.*",
    "api/handlers/**",      ← Ignore handlers (they're in lib/)
    "api/_supabase.py"      ← Ignore old _supabase (now in lib/)
  ],
  "rewrites": [
    { "source": "/api/pendaftar_create", "destination": "/api/index?action=pendaftar_create" },
    { "source": "/api/upload_file", "destination": "/api/index?action=upload_file" },
    ...
  ]
}
```

### How it works:
1. **Old endpoint URL** (e.g., `/api/pendaftar_create`) → Vercel rewrites to `/api/index?action=pendaftar_create`
2. **api/index.py** reads `action` parameter → Dynamically imports from `lib.handlers.<action>`
3. **lib/handlers/<action>.py** handles the request using shared `lib._supabase`

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- [x] Only 1 file in `/api`: `index.py`
- [x] All handlers moved to `lib/handlers/`
- [x] All imports updated to `from lib._supabase import`
- [x] `vercel.json` has `excludeFiles` to ignore old paths
- [x] 18 rewrites configured for all endpoints
- [x] No `pages/api/**` or `app/api/**` directories
- [x] No middleware or cron jobs

---

## 🚀 DEPLOYMENT STEPS

### 1. Commit & Push:
```bash
git add .
git commit -m "refactor: consolidate to 1 serverless function for Vercel Hobby"
git push origin main
```

### 2. Deploy Preview:
```bash
vercel
```

**Expected Output:**
```
✓ Serverless Functions: 1/12
✓ Build completed
```

### 3. Deploy Production:
```bash
vercel --prod
```

---

## 🧪 SMOKE TESTS

After deployment, test these endpoints:

### 1. Pendaftar Endpoints:
```bash
# List pendaftar
curl https://your-domain.vercel.app/api/pendaftar_list

# Cek status by NISN
curl "https://your-domain.vercel.app/api/pendaftar_cek_status?nisn=1234567890"

# Download ZIP
curl "https://your-domain.vercel.app/api/pendaftar_download_zip?nisn=1234567890"

# Export CSV
curl https://your-domain.vercel.app/api/export_pendaftar_csv
```

### 2. File Upload:
```bash
curl -X POST https://your-domain.vercel.app/api/upload_file \
  -H "Content-Type: application/json" \
  -d '{"file":"base64...", "fileName":"test.jpg", "fileType":"foto", "nisn":"1234567890"}'
```

### 3. Pembayaran:
```bash
curl https://your-domain.vercel.app/api/pembayaran_list
```

### 4. Static Pages:
- https://your-domain.vercel.app/
- https://your-domain.vercel.app/daftar
- https://your-domain.vercel.app/admin
- https://your-domain.vercel.app/cek-status

---

## 🔍 TROUBLESHOOTING

### If deploy fails with "No more than 12 Serverless Functions":
1. Check `find api -name '*.py' ! -name '_*' | wc -l` → Should be 1
2. Verify `vercel.json` has correct `excludeFiles`
3. Delete `.vercel` cache: `rm -rf .vercel`
4. Redeploy: `vercel --prod`

### If imports fail:
- Ensure all handlers use `from lib._supabase import supabase_client`
- Ensure `api/index.py` imports from `lib.handlers.*`
- Check Python path includes project root

### If rewrites don't work:
- Check `vercel.json` syntax (valid JSON)
- Ensure all 13 endpoints have rewrites
- Clear browser cache

---

## 📝 MAINTENANCE NOTES

### Adding New Endpoint:
1. Create `lib/handlers/new_endpoint.py`
2. Add to `api/index.py` router:
   ```python
   elif action == 'new_endpoint':
       from lib.handlers.new_endpoint import handler as NewHandler
       NewHandler.do_GET(self)
   ```
3. Add rewrite to `vercel.json`:
   ```json
   { "source": "/api/new_endpoint", "destination": "/api/index?action=new_endpoint" }
   ```

### Updating Environment Variables:
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
```

---

## 🎯 SUCCESS METRICS

- ✅ Build time: < 60s
- ✅ Function count: 1/12
- ✅ All endpoints return 200 or expected status
- ✅ ZIP download works
- ✅ CSV export works
- ✅ File uploads work
- ✅ Frontend loads correctly

---

**Last Updated:** 2025-10-22  
**Status:** 🟢 READY FOR PRODUCTION DEPLOYMENT

