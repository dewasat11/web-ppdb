from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import parse_qs, urlparse
from io import BytesIO
import zipfile
import re
from ._supabase import supabase_client


def slugify(text):
    """Convert text to URL-friendly slug"""
    text = str(text).lower().strip()
    text = re.sub(r'\s+', '-', text)
    text = re.sub(r'[^\w\-]', '', text)
    text = re.sub(r'\-\-+', '-', text)
    text = re.sub(r'^-+', '', text)
    text = re.sub(r'-+$', '', text)
    return text


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """
        GET /api/pendaftar_download_zip?nisn=1234567890
        Response: ZIP file stream
        """
        try:
            # Parse query parameters
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            nisn = (params.get("nisn", [""])[0] or "").strip()

            if not nisn:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"ok": False, "error": "NISN required"}).encode()
                )
                return

            # Get Supabase client
            supa = supabase_client(service_role=True)

            # Get pendaftar data
            pendaftar_result = (
                supa.table("pendaftar")
                .select("*")
                .eq("nisn", nisn)
                .execute()
            )

            if not pendaftar_result.data:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"ok": False, "error": "Pendaftar tidak ditemukan"}).encode()
                )
                return

            pendaftar = pendaftar_result.data[0]
            nama = pendaftar.get("namalengkap", "unknown")
            slug_name = slugify(nama)

            # List files from storage
            try:
                storage_files = supa.storage.from_("pendaftar-files").list(path=nisn)
            except Exception as e:
                print(f"Error listing files: {e}")
                storage_files = []

            # File type mapping
            file_type_map = {
                "ijazah": "Ijazah",
                "kk": "Kartu Keluarga",
                "akta": "Akta Kelahiran",
                "foto": "Pas Foto 3x4",
                "bpjs": "BPJS",
            }

            # Filter image files only
            image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
            image_files = []

            for file_obj in storage_files:
                if isinstance(file_obj, dict):
                    file_name = file_obj.get("name", "")
                    if any(file_name.lower().endswith(ext) for ext in image_extensions):
                        # Determine folder
                        folder = "Lainnya"
                        for key, label in file_type_map.items():
                            if key in file_name.lower():
                                folder = label
                                break
                        
                        image_files.append({
                            "name": file_name,
                            "path": f"{nisn}/{file_name}",
                            "folder": folder
                        })

            if not image_files:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"ok": False, "error": "Tidak ada foto tersedia"}).encode()
                )
                return

            # Create ZIP in memory
            zip_buffer = BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                success_count = 0
                
                for file_info in image_files:
                    try:
                        # Download file from storage
                        file_bytes = supa.storage.from_("pendaftar-files").download(file_info["path"])
                        
                        # Add to ZIP with folder structure
                        zip_path = f"{slug_name}/{file_info['folder']}/{file_info['name']}"
                        zip_file.writestr(zip_path, file_bytes)
                        success_count += 1
                        
                    except Exception as e:
                        print(f"Error adding {file_info['name']} to ZIP: {e}")
                        # Continue with other files

                if success_count == 0:
                    raise Exception("Semua file gagal didownload")

            # Get ZIP data
            zip_buffer.seek(0)
            zip_data = zip_buffer.read()

            # Send ZIP file
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", f'attachment; filename="{slug_name}.zip"')
            self.send_header("Content-Length", str(len(zip_data)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(zip_data)

        except Exception as e:
            print(f"Error in pendaftar_download_zip: {e}")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(
                json.dumps({"ok": False, "error": str(e)}).encode()
            )

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

