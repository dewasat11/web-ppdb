# Panduan Progressive Web App (PWA)

Seluruh halaman statis di folder `public/` kini sudah siap sebagai PWA. Ikuti langkah di bawah agar pengalaman instalasi di perangkat pengguna berjalan mulus.

## 1. Persiapan & Build Aset
- Gunakan Node.js versi 18+.
- Jalankan `npm install` jika belum pernah.
- Bangun ulang CSS Tailwind sebelum deploy:  
  ```
  npm run build:css
  ```
- Pastikan file ikon (`favicon.png`, `apple-touch-icon.png`, `logo-bimi.svg`) sudah menggunakan logo final lembaga. Ganti file di `public/` bila diperlukan; manifest dan service worker akan otomatis memakainya.

## 2. Menjalankan Secara Lokal
1. Jalankan server static dari folder root (wajib via HTTP/HTTPS, bukan `file://`):
   ```
   npx serve public -l 4173
   ```
   Gunakan opsi `--ssl-cert`/`--ssl-key` jika ingin menguji HTTPS lokal.
2. Buka `https://localhost:4173` (atau port yang Anda pilih).
3. Buka Chrome DevTools → tab **Application** → pastikan:
   - `manifest.webmanifest` terbaca tanpa error.
   - `sw.js` statusnya *activated and running*.
   - Section **Storage** memperlihatkan cache `ppdsb-pwa-v1`.
4. Tekan menu ⋮ di Chrome → **Install app** untuk menguji instalasi.

## 3. Uji Offline
1. Setelah situs termuat sempurna, aktifkan **Offline** di DevTools → Network.
2. Segarkan halaman:
   - Halaman yang pernah dibuka akan diambil dari cache.
   - Jika halaman baru diminta saat offline, pengguna diarahkan ke `offline.html`.
3. Kembalikan koneksi dan pastikan konten tersinkron kembali.

## 4. Deploy Produksi
- Hosting harus menyajikan konten lewat HTTPS (Vercel, Netlify, Cloudflare Pages sudah memenuhi).
- Pastikan folder `public/` menjadi root dokumen yang disajikan.
- Setelah deploy, jalankan Lighthouse (Chrome DevTools → Lighthouse → Progressive Web App) untuk memastikan semua checklist *green*.

## 5. Pemeliharaan Berkala
- **Menambah/merubah aset penting**: tambahkan path aset baru ke `CORE_ASSETS` di `public/sw.js`, lalu tingkatkan nama cache (`ppdsb-pwa-v2`, dst.) agar pengguna mendapat versi terbaru.
- **Mengubah ikon atau nama aplikasi**: edit `public/manifest.webmanifest` (field `name`, `short_name`, `description`, `icons`, dll.).
- **Penanganan event install khusus**: gunakan event `pwa-install-ready` yang dipancarkan dari `public/assets/js/pwa.js` jika ingin menampilkan dialog custom di masa depan.
- **Debug**: kosongkan cache aplikasi dari DevTools → Application → Storage → *Clear site data* bila terjadi perilaku lama akibat cache.

Dengan mengikuti langkah di atas, situs dapat di-*install* ke layar utama, berjalan dalam jendela terpisah, dan tetap memberikan konten penting saat offline.
