from http.server import BaseHTTPRequestHandler
import json
from ._supabase import supabase_client
import datetime
import time
import re

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Validasi required fields dengan pengecekan lebih ketat
            required_fields = ['nomor_registrasi', 'nama_lengkap', 'bukti_pembayaran']
            missing_fields = []
            for field in required_fields:
                if field not in data or not data[field]:
                    missing_fields.append(field)
            
            if missing_fields:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': f'Required fields missing: {", ".join(missing_fields)}'
                }).encode())
                return
            
            # Validasi format nomor registrasi
            nomor_registrasi = data['nomor_registrasi'].strip()
            if not re.match(r'^REG-\d{8}-\d{6}$', nomor_registrasi):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Format nomor registrasi tidak valid. Harus dalam format REG-YYYYMMDD-XXXXXX'
                }).encode())
                return
            
            # Validasi nama lengkap
            nama_lengkap = data['nama_lengkap'].strip()
            if len(nama_lengkap) < 3:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Nama lengkap minimal 3 karakter'
                }).encode())
                return
            
            # Validasi bukti pembayaran (harus URL)
            bukti_pembayaran = data['bukti_pembayaran'].strip()
            if not bukti_pembayaran.startswith(('http://', 'https://')):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Bukti pembayaran harus berupa URL yang valid'
                }).encode())
                return
            
            # Get Supabase client with service role for admin operations
            supa = supabase_client(service_role=True)
            
            # Check if pendaftar exists (kolom sudah diubah jadi nomor_registrasi)
            pendaftar = supa.table('pendaftar').select('*').eq('nomor_registrasi', nomor_registrasi).execute()
            
            pendaftar_data = getattr(pendaftar, 'data', None)
            if not pendaftar_data:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Nomor registrasi tidak ditemukan'
                }).encode())
                return
            
            # Check if payment already exists
            existing_payment = supa.table('pembayaran').select('*').eq('nomor_registrasi', nomor_registrasi).execute()
            
            existing_data = getattr(existing_payment, 'data', None)
            if existing_data:
                # Update existing payment
                result = supa.table('pembayaran').update({
                    'bukti_pembayaran': bukti_pembayaran,
                    'status_pembayaran': 'PENDING',
                    'catatan_admin': data.get('catatan', ''),
                    'updated_at': 'now()'  # Update timestamp
                }).eq('nomor_registrasi', nomor_registrasi).execute()
                
                response_data = {
                    'message': 'Pembayaran berhasil diupdate',
                    'nomor_pembayaran': existing_data[0]['nomor_pembayaran'],
                    'status': 'updated'
                }
            else:
                # Generate nomor pembayaran secara otomatis di sisi aplikasi
                now = datetime.datetime.now()
                
                # Coba buat nomor pembayaran unik dengan pendekatan retry
                max_attempts = 10
                nomor_pembayaran = None
                
                for attempt in range(max_attempts):
                    # Gunakan timestamp untuk membuat ID unik
                    timestamp_part = str(int(time.time() * 1000000))[-6:]  # Ambil 6 digit dari mikrodetik
                    nomor_pembayaran = f"PREG-{now.strftime('%Y%m%d')}-{timestamp_part.zfill(6)}"
                    
                    # Cek apakah nomor pembayaran sudah ada
                    existing = supa.table('pembayaran').select('id').eq('nomor_pembayaran', nomor_pembayaran).execute()
                    if not existing.data:
                        # Nomor unik ditemukan, keluar dari loop
                        break
                    else:
                        # Tunggu sebentar sebelum mencoba lagi untuk mencegah collision
                        time.sleep(0.01)
                else:
                    # Jika semua percobaan gagal, kirim error
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': 'Gagal membuat nomor pembayaran unik'
                    }).encode())
                    return
                
                # Insert new payment dengan field yang konsisten
                payment_data = {
                    'nomor_pembayaran': nomor_pembayaran,
                    'nomor_registrasi': nomor_registrasi,
                    'nama_lengkap': nama_lengkap,
                    'jumlah': 500000.00,
                    'metode_pembayaran': 'Transfer Bank BRI',
                    'bukti_pembayaran': bukti_pembayaran,
                    'status_pembayaran': 'PENDING',
                    'catatan_admin': data.get('catatan', ''),
                    'tanggal_upload': 'now()',  # Set timestamp upload
                    'created_at': 'now()',       # Set timestamp dibuat
                    'updated_at': 'now()'        # Set timestamp diupdate
                }
                
                result = supa.table('pembayaran').insert(payment_data).execute()
                
                response_data = {
                    'message': 'Pembayaran berhasil disubmit',
                    'nomor_pembayaran': nomor_pembayaran,
                    'status': 'created'
                }
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            print(f"Error in pembayaran_submit: {str(e)}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e)
            }).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()