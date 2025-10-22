from http.server import BaseHTTPRequestHandler
import json
import base64
import re
from datetime import datetime
from .._supabase import supabase_client


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))

            file_base64 = data.get("file")
            file_name = data.get("fileName")
            file_type = data.get("fileType")
            nisn = data.get("nisn")

            print(f"Upload request - File: {file_name}, Type: {file_type}, NISN: {nisn}")

            # Validasi input wajib
            if not all([file_base64, file_name, nisn]):
                self.send_response(400)
                self.send_header("Content-type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"ok": False, "error": "Missing required fields: file, fileName, nisn"}).encode()
                )
                return

            # Validasi NISN
            if nisn == "undefined" or not nisn.strip():
                self.send_response(400)
                self.send_header("Content-type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"ok": False, "error": "NISN tidak valid"}).encode()
                )
                return

            # Validasi format NISN (10 digit)
            if not re.match(r'^\d{10}$', nisn):
                self.send_response(400)
                self.send_header("Content-type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"ok": False, "error": "Format NISN tidak valid. Harus 10 digit angka"}).encode()
                )
                return

            # Validasi format file base64
            if not file_base64.startswith('data:') and ',' not in file_base64:
                # Jika ini adalah base64 mentah (bukan data URL)
                pass
            elif file_base64.startswith('data:'):
                # Ekstrak base64 dari data URL jika diperlukan
                try:
                    file_base64 = file_base64.split(',')[1]
                except:
                    raise Exception("Format data URL tidak valid")

            # Decode base64 file
            try:
                file_data = base64.b64decode(file_base64)
                print(f"File decoded, size: {len(file_data)} bytes")
            except Exception as e:
                raise Exception(f"Gagal decode file: {str(e)}")

            # Validasi ukuran file (maksimal 5MB)
            if len(file_data) > 5 * 1024 * 1024:
                self.send_response(400)
                self.send_header("Content-type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"ok": False, "error": "Ukuran file maksimal 5MB"}).encode()
                )
                return

            # Validasi tipe file berdasarkan ekstensi
            allowed_extensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
            file_ext = file_name.split('.')[-1].lower()
            if file_ext not in allowed_extensions:
                self.send_response(400)
                self.send_header("Content-type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"ok": False, "error": f"Tipe file tidak diizinkan. Format yang diizinkan: {', '.join(allowed_extensions)}"}).encode()
                )
                return

            # Generate unique filename dengan format yang konsisten
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_filename = f"{nisn}/{file_type}_{timestamp}.{file_ext}"

            print(f"Uploading to: {unique_filename}")

            # Get Supabase client with service role for admin operations
            supa = supabase_client(service_role=True)
            
            # Tentukan content-type berdasarkan ekstensi file
            mime_types = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'pdf': 'application/pdf',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
            content_type = mime_types.get(file_ext, 'application/octet-stream')

            # Upload to Supabase Storage
            response = supa.storage.from_("pendaftar-files").upload(
                path=unique_filename,
                file=file_data,
                file_options={"content-type": content_type}
            )

            print(f"Upload response: {response}")

            # Get public URL
            public_url = supa.storage.from_("pendaftar-files").get_public_url(unique_filename)

            print(f"Public URL: {public_url}")

            # Return success
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(
                json.dumps({"ok": True, "url": public_url, "filename": unique_filename}).encode()
            )

        except Exception as e:
            error_msg = str(e)
            print(f"Upload error: {error_msg}")
            
            # Check if bucket not found error
            if "Bucket not found" in error_msg or "404" in error_msg:
                error_msg = "Storage bucket 'pendaftar-files' belum dibuat. Silakan buat bucket terlebih dahulu di Supabase Dashboard > Storage."
            elif "duplicate" in error_msg.lower():
                error_msg = "File dengan nama yang sama sudah ada. Mencoba upload ulang..."
            
            self.send_response(500)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(
                json.dumps({"ok": False, "error": error_msg}).encode()
            )

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()