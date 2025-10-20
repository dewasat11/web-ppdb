from http.server import BaseHTTPRequestHandler
import json
from ._supabase import supabase_client
import re

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Validasi required fields dengan pengecekan lebih ketat
            if 'nomor_pembayaran' not in data or not data['nomor_pembayaran']:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'nomor_pembayaran is required'
                }).encode())
                return
            
            if 'status' not in data or not data['status']:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'status is required'
                }).encode())
                return
            
            # Validasi format nomor pembayaran
            nomor_pembayaran = data['nomor_pembayaran'].strip()
            if not re.match(r'^PREG-\d{8}-\d{6}$', nomor_pembayaran):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Format nomor pembayaran tidak valid'
                }).encode())
                return
            
            # Validasi status dengan lebih ketat
            valid_statuses = ['VERIFIED', 'REJECTED']
            status = str(data['status']).upper()
            
            if status not in valid_statuses:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                }).encode())
                return
            
            # Get Supabase client with service role for admin operations
            supa = supabase_client(service_role=True)
            
            # Cek apakah pembayaran dengan nomor tersebut ada
            existing_payment = supa.table('pembayaran').select('id').eq('nomor_pembayaran', nomor_pembayaran).execute()
            
            if not existing_payment.data:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Nomor pembayaran tidak ditemukan'
                }).encode())
                return
            
            # Update payment status dengan field yang konsisten
            update_data = {
                'status_pembayaran': status,
                'verified_by': data.get('verified_by', data.get('verifiedBy', 'admin')),
                'catatan_admin': data.get('catatan', ''),
                'tanggal_verifikasi': 'now()',  # Set timestamp verifikasi
                'updated_at': 'now()'           # Update timestamp
            }
            
            result = supa.table('pembayaran').update(update_data).eq('nomor_pembayaran', nomor_pembayaran).execute()
            
            # Validasi hasil update
            if not result.data:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Pembayaran tidak ditemukan'
                }).encode())
                return
            
            # Jika pembayaran VERIFIED, update juga status pendaftar terkait
            if status == 'VERIFIED':
                try:
                    # Ambil nomor registrasi dari pembayaran untuk update pendaftar
                    payment_info = supa.table('pembayaran').select('nomor_registrasi').eq('nomor_pembayaran', nomor_pembayaran).execute()
                    
                    if payment_info.data:
                        nomor_registrasi = payment_info.data[0]['nomor_registrasi']
                        
                        # Update status pendaftar menjadi DITERIMA
                        pendaftar_update = {
                            'statusberkas': 'DITERIMA',
                            'verifiedby': data.get('verified_by', data.get('verifiedBy', 'admin')),
                            'verifiedat': 'now()',
                            'updatedat': 'now()'
                        }
                        
                        supa.table('pendaftar').update(pendaftar_update).eq('nomor_registrasi', nomor_registrasi).execute()
                except Exception as e:
                    # Jika terjadi error saat update pendaftar, log error tapi tidak menggagalkan request
                    print(f"Warning: Gagal update status pendaftar: {str(e)}")
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'message': f'Pembayaran berhasil di{status.lower()}',
                'nomor_pembayaran': nomor_pembayaran,
                'status': status
            }).encode())
            
        except Exception as e:
            print(f"Error in pembayaran_verify: {str(e)}")
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