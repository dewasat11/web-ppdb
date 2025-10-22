from http.server import BaseHTTPRequestHandler
import json
from lib._supabase import supabase_client
import re

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Validasi required fields dengan pengecekan lebih ketat
            if 'nisn' not in data or not data['nisn']:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'NISN is required'
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
            
            # Validasi format NISN (10 digit)
            nisn = data['nisn'].strip()
            if not re.match(r'^\d{10}$', nisn):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Format NISN tidak valid. Harus 10 digit angka'
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
            
            # Cek apakah pembayaran dengan NISN tersebut ada
            existing_payment = supa.table('pembayaran').select('*').or_(f'nisn.eq.{nisn},nik.eq.{nisn}').execute()
            
            if not existing_payment.data:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Pembayaran dengan NISN tersebut tidak ditemukan'
                }).encode())
                return
            
            # Update payment status dengan field yang konsisten
            update_data = {
                'status_pembayaran': status,
                'verified_by': data.get('verified_by', data.get('verifiedBy', 'admin')),
                'catatan_admin': data.get('catatan_admin', ''),
                'tanggal_verifikasi': 'now()',  # Set timestamp verifikasi
                'updated_at': 'now()'           # Update timestamp
            }
            
            result = supa.table('pembayaran').update(update_data).or_(f'nisn.eq.{nisn},nik.eq.{nisn}').execute()
            
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
                    # Update status pendaftar berdasarkan NISN
                    pendaftar_update = {
                        'statusberkas': 'DITERIMA',
                        'verifiedby': data.get('verified_by', data.get('verifiedBy', 'admin')),
                        'verifiedat': 'now()',
                        'updatedat': 'now()'
                    }
                    
                    supa.table('pendaftar').update(pendaftar_update).or_(f'nisn.eq.{nisn},nikcalon.eq.{nisn}').execute()
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
                'nisn': nisn,
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