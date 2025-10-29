# Setup WhatsApp Notification

## 📱 Fitur WhatsApp Auto Notification

Sistem akan **otomatis mengirim pesan WhatsApp** kepada pendaftar saat admin klik tombol **"Diterima"** (verifikasi berkas).

### Isi Pesan WhatsApp:

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

## 🔧 Setup WhatsApp API Provider

Pilih salah satu provider berikut:

### Option 1: Fonnte.com (Recommended) ⭐

**Kelebihan:**
- ✅ Mudah setup
- ✅ Harga terjangkau (~Rp 100-200/pesan)
- ✅ Support WhatsApp Official API
- ✅ Tidak perlu server/VPS
- ✅ Dashboard lengkap

**Setup:**

1. **Daftar di Fonnte**
   - Buka https://fonnte.com
   - Klik **Daftar**
   - Isi form registrasi

2. **Dapatkan API Token**
   - Login ke dashboard
   - Pergi ke menu **Setting** → **API**
   - Copy **Token** Anda

3. **Connect WhatsApp Device**
   - Scan QR Code dengan WhatsApp Anda
   - Atau gunakan WhatsApp Business API (berbayar)

4. **Set Environment Variables di Vercel**
   ```bash
   WHATSAPP_API_TOKEN=your_fonnte_token_here
   WHATSAPP_API_PROVIDER=fonnte
   ```

5. **Test**
   - Deploy aplikasi
   - Verifikasi pendaftar di admin panel
   - Cek apakah pesan WhatsApp terkirim

---

### Option 2: Wablas.com

**Setup:**

1. **Daftar di Wablas**
   - Buka https://wablas.com
   - Pilih paket (mulai Rp 250rb/bulan)

2. **Dapatkan API Token & Domain**
   - Login → Device
   - Copy **Token** dan **Domain** (contoh: `solo.wablas.com`)

3. **Set Environment Variables**
   ```bash
   WHATSAPP_API_TOKEN=your_wablas_token_here
   WHATSAPP_API_PROVIDER=wablas
   WABLAS_DOMAIN=solo.wablas.com
   ```

---

### Option 3: Woowa.id

**Setup:**

1. **Daftar di Woowa**
   - Buka https://woowa.id
   - Pilih paket

2. **Dapatkan API Token**
   - Login → API Settings
   - Generate **Bearer Token**

3. **Set Environment Variables**
   ```bash
   WHATSAPP_API_TOKEN=your_woowa_token_here
   WHATSAPP_API_PROVIDER=woowa
   ```

---

## 🌐 Setup Environment Variables di Vercel

1. **Login ke Vercel Dashboard**
   - Buka https://vercel.com
   - Pilih project Anda

2. **Tambah Environment Variables**
   - Pergi ke **Settings** → **Environment Variables**
   - Klik **Add New**
   
   **Variables yang perlu ditambahkan:**
   
   | Key | Value | Description |
   |-----|-------|-------------|
   | `WHATSAPP_API_TOKEN` | `your_token_here` | API Token dari provider |
   | `WHATSAPP_API_PROVIDER` | `fonnte` / `wablas` / `woowa` | Provider yang digunakan |
   | `WABLAS_DOMAIN` | `solo.wablas.com` | (Hanya untuk Wablas) |

3. **Redeploy**
   - Klik **Deployments**
   - Klik **Redeploy** untuk apply env vars

---

## 🧪 Testing WhatsApp Notification

### 1. Test Manual via Admin Panel

1. Login sebagai admin
2. Buka **Data Pendaftar**
3. Pilih pendaftar dengan nomor HP valid
4. Klik **Detail**
5. Klik tombol **"Diterima"**
6. Cek:
   - ✅ Status berubah jadi "DITERIMA"
   - ✅ Muncul notifikasi sukses di browser
   - ✅ Pesan WhatsApp terkirim ke nomor HP pendaftar

### 2. Check Logs di Vercel

```
Vercel Dashboard → Deployments → [Latest] → Functions → View Logs
```

Cari log:
```
[VERIFIKASI] Status DITERIMA - sending WhatsApp notification...
[VERIFIKASI] Sending WA to [Nama] (628xxx...)
[WHATSAPP/FONNTE] Sending to 628xxx...
[WHATSAPP/FONNTE] Response: {"status": true, ...}
[VERIFIKASI] ✅ WhatsApp sent successfully via fonnte
```

### 3. Test Nomor HP Format

Nomor HP akan dinormalisasi otomatis:

| Input | Output (Normalized) |
|-------|---------------------|
| `081234567890` | `6281234567890` |
| `+6281234567890` | `6281234567890` |
| `0812-3456-7890` | `6281234567890` |
| `62 812 3456 7890` | `6281234567890` |

---

## 🔍 Troubleshooting

### ❌ "WhatsApp API token not configured"

**Penyebab:** Environment variable `WHATSAPP_API_TOKEN` tidak di-set

**Solusi:**
1. Set environment variable di Vercel
2. Redeploy aplikasi

---

### ❌ Pesan tidak terkirim, log: "Fonnte error: ..."

**Penyebab:**
- Token salah
- Device WhatsApp tidak terkoneksi
- Nomor HP tidak valid
- Saldo habis

**Solusi:**
1. Cek token di Fonnte dashboard
2. Pastikan device WhatsApp terkoneksi (scan QR lagi jika perlu)
3. Cek nomor HP di database (harus ada di table `pendaftar.nomorhp`)
4. Top up saldo jika habis

---

### ❌ Log: "Missing data - HP: false"

**Penyebab:** Field `nomorhp` kosong di database

**Solusi:**
1. Pastikan form pendaftaran include field nomor HP
2. Check field name di database: `nomorhp` (bukan `nomor_hp` atau `phone`)

---

### ⚠️ WhatsApp terkirim tapi status verifikasi gagal

**Catatan:** WhatsApp notification bersifat **non-critical** - jika gagal, proses verifikasi tetap lanjut.

Cek response JSON dari API:
```json
{
  "success": true,
  "message": "Status pendaftar berhasil diubah menjadi DITERIMA",
  "whatsapp": {
    "sent": true,
    "provider": "fonnte",
    "message": "WhatsApp sent via Fonnte"
  }
}
```

---

## 💰 Estimasi Biaya

### Fonnte (Pay-per-Message)
- **Harga:** ~Rp 150/pesan
- **Estimasi:** 100 pendaftar = Rp 15.000
- **Top-up minimal:** Rp 50.000

### Wablas (Subscription)
- **Harga:** Rp 250.000 - 500.000/bulan (unlimited messages)
- **Cocok untuk:** Volume tinggi (>500 pendaftar/bulan)

### Woowa (Hybrid)
- **Harga:** Mulai Rp 100.000/bulan + per-message

---

## 🎨 Customize Pesan WhatsApp

Edit file: `lib/whatsapp_notifier.py`

```python
# Line ~47-72
message = f"""*🎉 SELAMAT! Pendaftaran Anda TERVERIFIKASI*

Assalamu'alaikum {nama},

... (edit sesuai keinginan) ...

Jazakumullahu khairan,
*Panitia PPDSB Pondok Pesantren Al Ikhsan Beji*"""
```

**Tips:**
- Gunakan `*bold*` untuk teks tebal
- Gunakan `_italic_` untuk teks miring
- Gunakan emoji untuk visual menarik
- Keep it concise (max 1000 karakter)

---

## 🔐 Security Best Practices

1. ✅ **JANGAN** commit API token ke repository
2. ✅ **SIMPAN** token di environment variables Vercel
3. ✅ **ROTASI** token secara berkala (3-6 bulan)
4. ✅ **MONITORING** logs untuk detect spam/abuse
5. ✅ **LIMIT** jumlah pesan per hari jika perlu

---

## 📊 Monitoring & Analytics

### Vercel Logs
```bash
# View real-time logs
vercel logs --follow

# Search WhatsApp logs
vercel logs | grep WHATSAPP
```

### Provider Dashboard
- **Fonnte:** Dashboard → History → Sent Messages
- **Wablas:** Device → Message History
- **Woowa:** Analytics → Sent Messages

---

## 📝 Related Files

- **Backend Logic:** `lib/handlers/pendaftar_status.py`
- **WhatsApp Helper:** `lib/whatsapp_notifier.py`
- **Frontend:** `public/assets/js/admin.js` (function `verifikasiPendaftar`)

---

## 🆘 Support

Jika ada masalah:

1. **Check Logs** di Vercel Dashboard
2. **Check Provider Dashboard** (Fonnte/Wablas/Woowa)
3. **Check Database** (field `nomorhp` harus terisi)
4. **Contact Provider Support** untuk masalah API

---

**Last Updated:** 2025-01-29  
**Feature:** WhatsApp Auto Notification for Verified Applicants

