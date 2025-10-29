# Environment Variables Setup Guide

## 🔐 Token yang Anda Miliki

✅ **Fonnte API Token:** `DBgw81D9Xeh5K5TgyQP55cNpstvApvj3ANTTSsrWRjYa`

⚠️ **PENTING:** 
- **JANGAN** commit token ini ke Git/GitHub
- **SIMPAN** hanya di Vercel Environment Variables
- Token ini bersifat **RAHASIA** seperti password

---

## 🚀 Cara Set Environment Variables di Vercel

### Step 1: Login ke Vercel Dashboard

1. Buka https://vercel.com
2. Login dengan akun Anda
3. Pilih project **pendaftaran-web** (atau nama project Anda)

### Step 2: Buka Settings

1. Klik tab **Settings** di top menu
2. Scroll ke section **Environment Variables** di sidebar kiri
3. Klik **Environment Variables**

### Step 3: Tambah Variable WhatsApp

Tambahkan **2 variables** berikut:

#### Variable 1: WHATSAPP_API_TOKEN

- **Key:** `WHATSAPP_API_TOKEN`
- **Value:** `DBgw81D9Xeh5K5TgyQP55cNpstvApvj3ANTTSsrWRjYa`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Klik **Save**

#### Variable 2: WHATSAPP_API_PROVIDER

- **Key:** `WHATSAPP_API_PROVIDER`
- **Value:** `fonnte`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Klik **Save**

### Step 4: Redeploy

Setelah save environment variables:

1. Klik tab **Deployments**
2. Klik **︙** (3 dots) pada deployment terakhir
3. Klik **Redeploy**
4. Tunggu hingga deployment selesai

---

## ✅ Verifikasi Setup

### 1. Check Environment Variables

Di Vercel Dashboard → Settings → Environment Variables, pastikan ada:

```
WHATSAPP_API_TOKEN = DBgw81D9Xeh5K5TgyQP55cNpstvApvj3ANTTSsrWRjYa
WHATSAPP_API_PROVIDER = fonnte
```

### 2. Test Notification

1. Login sebagai admin di website
2. Buka **Data Pendaftar**
3. Pilih pendaftar yang punya nomor HP valid
4. Klik **Detail** → Klik **"Diterima"**
5. Tunggu beberapa detik
6. **Cek WhatsApp** nomor HP pendaftar tersebut

### 3. Check Alert Message

Setelah klik "Diterima", akan muncul alert:

```
✅ Status berhasil diubah menjadi "DITERIMA"!

📱 WhatsApp Notification: TERKIRIM ✅
   Provider: fonnte
```

Jika terkirim = ✅ Setup berhasil!

### 4. Check Logs (Optional)

Vercel Dashboard → Deployments → [Latest] → View Function Logs

Cari log:
```
[VERIFIKASI] Status DITERIMA - sending WhatsApp notification...
[VERIFIKASI] Sending WA to Ahmad Fauzi (628xxx...)
[WHATSAPP/FONNTE] Sending to 628xxx...
[WHATSAPP/FONNTE] Response: {"status": true, ...}
[VERIFIKASI] ✅ WhatsApp sent successfully via fonnte
```

---

## 📱 Isi Pesan yang Akan Dikirim

```
🎉 SELAMAT! Pendaftaran Anda TERVERIFIKASI

Assalamu'alaikum [Nama Pendaftar],

Kami dengan senang hati memberitahukan bahwa:

✅ BERKAS PENDAFTARAN ANDA TELAH DIVERIFIKASI

📋 Detail:
• Nama: [Nama Lengkap]
• NISN: [NISN]

📌 LANGKAH SELANJUTNYA:
Silakan lakukan pembayaran untuk menyelesaikan proses pendaftaran.

🔗 Cek Status & Lanjut Pembayaran:
https://www.alikhsan-beji.app/cek-status.html

⏰ Segera lakukan pembayaran untuk mengamankan tempat Anda.

Jika ada pertanyaan, silakan hubungi admin kami.

Jazakumullahu khairan,
Panitia PPDSB Pondok Pesantren Al Ikhsan Beji
```

---

## 🔧 Troubleshooting

### ❌ WhatsApp tidak terkirim

**Check 1: Token benar?**
- Pastikan token yang di-set PERSIS seperti: `DBgw81D9Xeh5K5TgyQP55cNpstvApvj3ANTTSsrWRjYa`
- Tidak ada spasi di depan/belakang

**Check 2: Device Fonnte terkoneksi?**
- Login ke https://fonnte.com
- Check status device (harus hijau/connected)
- Jika putus, scan QR code lagi

**Check 3: Nomor HP pendaftar valid?**
- Check di database, field `nomorhp` harus terisi
- Format: `081234567890` atau `6281234567890` (otomatis dinormalisasi)

**Check 4: Saldo Fonnte cukup?**
- Login ke Fonnte dashboard
- Check saldo (minimal ~Rp 150/pesan)
- Top-up jika habis

### ⚠️ Alert menunjukkan "WhatsApp: Tidak dikonfigurasi"

**Penyebab:** Environment variable belum di-set atau belum di-redeploy

**Solusi:**
1. Re-check Step 3 di atas (pastikan sudah save)
2. Redeploy aplikasi
3. Clear cache browser (Ctrl+Shift+R)
4. Test lagi

---

## 💰 Estimasi Biaya Fonnte

- **Harga per pesan:** ~Rp 100-200 (tergantung paket)
- **Top-up minimal:** Rp 50.000
- **Estimasi:**
  - 10 pendaftar/hari = Rp 1.500/hari = Rp 45.000/bulan
  - 50 pendaftar/hari = Rp 7.500/hari = Rp 225.000/bulan
  - 100 pendaftar/hari = Rp 15.000/hari = Rp 450.000/bulan

**Tips Hemat:**
- WhatsApp hanya terkirim saat status = DITERIMA (bukan setiap aksi)
- 1 pendaftar = 1 WhatsApp notification saja
- Tidak ada biaya recurring/bulanan (pay-per-message)

---

## 🎨 Customize Pesan (Optional)

Jika ingin ubah isi pesan WhatsApp:

1. Edit file: `lib/whatsapp_notifier.py`
2. Cari function `send_whatsapp_verification`
3. Edit bagian `message = f"""..."""` (line ~47-72)
4. Commit & push ke Git
5. Vercel auto-deploy

---

## 📋 Environment Variables Lengkap

Untuk reference, ini semua environment variables yang perlu di-set:

```bash
# Database (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WhatsApp (OPTIONAL)
WHATSAPP_API_TOKEN=DBgw81D9Xeh5K5TgyQP55cNpstvApvj3ANTTSsrWRjYa
WHATSAPP_API_PROVIDER=fonnte
```

---

## ✅ Checklist Setup

- [ ] Token Fonnte sudah di-copy: `DBgw81D9Xeh5K5TgyQP55cNpstvApvj3ANTTSsrWRjYa`
- [ ] Login ke Vercel Dashboard
- [ ] Set `WHATSAPP_API_TOKEN` di Environment Variables
- [ ] Set `WHATSAPP_API_PROVIDER=fonnte` di Environment Variables
- [ ] Redeploy aplikasi
- [ ] Test verifikasi pendaftar
- [ ] Check WhatsApp notification terkirim ✅
- [ ] Check alert menunjukkan "TERKIRIM ✅"

---

**Ready to deploy!** 🚀

Setelah setup selesai, setiap kali admin klik "Diterima", pendaftar akan langsung dapat WhatsApp notification otomatis.

