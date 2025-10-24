from http.server import BaseHTTPRequestHandler
import json
import base64
import re
from datetime import datetime
from io import BytesIO
from PIL import Image   # ✅ untuk kompres gambar
from lib._supabase import supabase_client


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
                return self._send_error(400, "Missing required fields: file, fileName, nisn")

            # Validasi NISN
            if nisn == "undefined" or not nisn.strip():
                return self._send_error(400, "NISN tidak valid")

            # Validasi format NISN (10 digit)
            if not re.match(r"^\d{10}$", nisn):
                return self._send_error(400, "Format NISN tidak valid. Harus 10 digit angka")

            # Ambil base64 data (hilangkan prefix data:)
            if file_base64.startswith("data:"):
                try:
                    file_base64 = file_base64.split(",")[1]
                except Exception:
                    raise Exception("Format data URL tidak valid")

            # Decode base64 file
            try:
                file_data = base64.b64decode(file_base64)
                print(f"File decoded, size: {len(file_data)} bytes")
            except Exception as e:
                raise Exception(f"Gagal decode file: {str(e)}")

            # Validasi tipe file
            allowed_extensions = ["jpg", "jpeg", "png", "pdf", "doc", "docx"]
            file_ext = file_name.split(".")[-1].lower()
            if file_ext not in allowed_extensions:
                return self._send_error(
                    400,
                    f"Tipe file tidak diizinkan. Hanya: {', '.join(allowed_extensions)}",
                )

            # ✅ KOMpres otomatis untuk gambar
            if file_ext in ["jpg", "jpeg", "png"]:
                try:
                    file_data = self._compress_image(file_data, target_kb=500)
                except Exception as e:
                    print(f"[Warning] Kompres gagal: {e}")

            # Validasi ukuran maksimal 5MB
            if len(file_data) > 5 * 1024 * 1024:
                return self._send_error(400, "Ukuran file maksimal 5MB setelah kompres")

            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_filename = f"{nisn}/{file_type}_{timestamp}.{file_ext}"
            print(f"Uploading to: {unique_filename}")

            # Upload ke Supabase Storage
            supa = supabase_client(service_role=True)

            mime_types = {
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "png": "image/png",
                "pdf": "application/pdf",
                "doc": "application/msword",
                "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            }
            content_type = mime_types.get(file_ext, "application/octet-stream")

            response = supa.storage.from_("pendaftar-files").upload(
                path=unique_filename,
                file=file_data,
                file_options={"content-type": content_type},
            )
            print(f"Upload response: {response}")

            # Get public URL
            public_url = supa.storage.from_("pendaftar-files").get_public_url(unique_filename)
            print(f"Public URL: {public_url}")

            # Return success
            self._send_json(200, {"ok": True, "url": public_url, "filename": unique_filename})

        except Exception as e:
            error_msg = str(e)
            print(f"Upload error: {error_msg}")
            if "Bucket not found" in error_msg or "404" in error_msg:
                error_msg = "Storage bucket 'pendaftar-files' belum dibuat. Silakan buat bucket di Supabase Dashboard > Storage."
            elif "duplicate" in error_msg.lower():
                error_msg = "File dengan nama yang sama sudah ada."
            self._send_error(500, error_msg)

    # 🔧 Helper: kirim error
    def _send_error(self, code, msg):
        self.send_response(code)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": False, "error": msg}).encode())

    # 🔧 Helper: kirim sukses
    def _send_json(self, code, data):
        self.send_response(code)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    # 🧩 Fungsi kompres gambar otomatis (≈0.5 MB)
    def _compress_image(self, file_data, target_kb=500):
        img = Image.open(BytesIO(file_data))
        img_format = img.format if img.format else "JPEG"

        quality = 85
        while True:
            buffer = BytesIO()
            img.save(buffer, format=img_format, quality=quality, optimize=True)
            size_kb = buffer.tell() / 1024
            print(f"Compress test: {size_kb:.1f} KB (q={quality})")

            if size_kb <= target_kb or quality <= 40:
                print(f"✅ Final size: {size_kb:.1f} KB (quality={quality})")
                return buffer.getvalue()

            quality -= 5  # turunkan kualitas bertahap

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
