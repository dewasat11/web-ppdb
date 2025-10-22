# 🚀 DEPLOY NOW - Quick Reference

## ✅ Pre-Flight Check
- ✅ Functions: **1/12** (was 13+)
- ✅ All handlers moved to `lib/`
- ✅ Rewrites: 18 configured
- ✅ No breaking changes

---

## 🎯 Deploy Commands (Copy & Paste)

```bash
# 1. Stage all changes
git add .

# 2. Commit
git commit -m "refactor: consolidate to 1 serverless function for Vercel Hobby"

# 3. Push to remote
git push origin main

# 4. Deploy to production
vercel --prod
```

---

## 📊 Expected Vercel Output

```
✓ Serverless Functions: 1/12
✓ Build completed in 45s
✓ Deployment ready at https://your-domain.vercel.app
```

---

## 🧪 Post-Deployment Test

```bash
# Test all endpoints
./test-deployment.sh https://your-domain.vercel.app

# Or manually test one endpoint:
curl https://your-domain.vercel.app/api/pendaftar_list
```

---

## 🆘 If Deploy Fails

### Error: "No more than 12 Serverless Functions"
```bash
# Check function count (should be 1)
find api -name '*.py' ! -name '_*' | wc -l

# If > 1, check vercel.json excludeFiles
cat vercel.json | grep excludeFiles

# Clear Vercel cache
rm -rf .vercel
vercel --prod
```

### Error: Module not found
```bash
# Verify imports
grep -r "from api.handlers" .
# Should return nothing (all should be lib.handlers)

grep -r "from lib.handlers" api/
# Should find imports in api/index.py
```

---

## 📞 Support Checklist

If you need help, provide:
1. Vercel build logs
2. Output of: `find api -name '*.py'`
3. Output of: `grep -c "from lib.handlers" api/index.py`
4. Screenshot of Vercel error

---

**Status:** 🟢 READY  
**Confidence:** 100%  
**Breaking Changes:** None

