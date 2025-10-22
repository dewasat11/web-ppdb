from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import parse_qs, urlparse
from io import BytesIO
import zipfile
import re
from datetime import datetime
from lib._supabase import supabase_client


def slugify(text):
    """Convert text to URL-friendly slug"""
    text = str(text).lower().strip()
    text = re.sub(r'\s+', '-', text)
    text = re.sub(r'[^\w\-]', '', text)
    text = re.sub(r'\-\-+', '-', text)
    text = re.sub(r'^-+', '', text)
    text = re.sub(r'-+$', '', text)
    return text if text else 'unnamed'


def detect_file_type(filename):
    """Detect file type based on filename"""
    filename_lower = filename.lower()
    
    # File type mapping
    type_map = {
        "Ijazah": ["ijazah", "raport", "sttb"],
        "Kartu Keluarga": ["kk", "kartu_keluarga", "kartu-keluarga"],
        "Akta Kelahiran": ["akta", "akte", "kelahiran"],
        "Pas Foto 3x4": ["foto", "pasfoto", "pas-foto", "3x4"],
        "BPJS": ["bpjs", "kartu-bpjs"],
    }
    
    for folder, keywords in type_map.items():
        if any(keyword in filename_lower for keyword in keywords):
            return folder
    
    return "Lainnya"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """
        GET /api/pendaftar_download_zip?only=all&status=verified
        Response: ZIP file with ALL files from ALL pendaftar
        """
        try:
            # Parse query parameters
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            only_type = (params.get("only", ["all"])[0] or "all").strip()
            status_filter = (params.get("status", [""])[0] or "").strip()
            date_from = (params.get("date_from", [""])[0] or "").strip()
            date_to = (params.get("date_to", [""])[0] or "").strip()

            # Get Supabase client with SERVICE_ROLE
            supa = supabase_client(service_role=True)

            # Build query for pendaftar
            query = supa.table("pendaftar").select("*")
            
            # Apply filters
            if status_filter in ["pending", "verified", "rejected"]:
                query = query.eq("status", status_filter)
            
            if date_from:
                query = query.gte("created_at", date_from)
            
            if date_to:
                query = query.lte("created_at", date_to)
            
            # Execute query
            pendaftar_result = query.order("namalengkap").execute()

            if not pendaftar_result.data:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"ok": False, "error": "Tidak ada pendaftar ditemukan"}).encode()
                )
                return

            pendaftar_list = pendaftar_result.data
            
            # Image extensions for filtering
            image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]
            all_extensions = image_extensions + [".pdf", ".doc", ".docx", ".xlsx", ".xls"]
            
            # Determine which extensions to include
            target_extensions = image_extensions if only_type == "images" else all_extensions

            # Create ZIP in memory with streaming
            zip_buffer = BytesIO()
            total_files = 0
            success_count = 0
            failed_files = []
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for pendaftar in pendaftar_list:
                    nisn = pendaftar.get("nisn", "")
                    nama = pendaftar.get("namalengkap", "Unknown")
                    slug_name = slugify(nama)
                    
                    if not nisn:
                        continue
                    
                    # List files from storage for this pendaftar
                    try:
                        storage_files = supa.storage.from_("pendaftar-files").list(path=nisn)
                    except Exception as e:
                        print(f"Error listing files for {nisn}: {e}")
                        failed_files.append(f"{nama} (list error)")
                        continue
                    
                    # Process each file
                    for file_obj in storage_files:
                        if not isinstance(file_obj, dict):
                            continue
                        
                        file_name = file_obj.get("name", "")
                        
                        # Check if file type matches filter
                        if not any(file_name.lower().endswith(ext) for ext in target_extensions):
                            continue
                        
                        total_files += 1
                        
                        # Determine folder
                        folder = detect_file_type(file_name)
                        
                        # Build file path
                        file_path = f"{nisn}/{file_name}"
                        zip_path = f"{slug_name}/{folder}/{file_name}"
                        
                        try:
                            # Download file from storage
                            file_bytes = supa.storage.from_("pendaftar-files").download(file_path)
                            
                            # Add to ZIP
                            zip_file.writestr(zip_path, file_bytes)
                            success_count += 1
                            
                        except Exception as e:
                            print(f"Error adding {file_path} to ZIP: {e}")
                            failed_files.append(f"{nama}/{folder}/{file_name}")
                            # Continue with other files

            if success_count == 0:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({
                        "ok": False, 
                        "error": "Tidak ada berkas yang berhasil diunduh",
                        "total_pendaftar": len(pendaftar_list),
                        "total_files": total_files,
                        "failed": len(failed_files)
                    }).encode()
                )
                return

            # Get ZIP data
            zip_buffer.seek(0)
            zip_data = zip_buffer.read()

            # Generate filename
            today = datetime.now().strftime('%Y%m%d')
            filename = f"semua-berkas_{today}.zip"

            # Send ZIP file
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
            self.send_header("Content-Length", str(len(zip_data)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(zip_data)
            
            # Log summary
            print(f"✓ ZIP created: {filename}")
            print(f"  Pendaftar: {len(pendaftar_list)}")
            print(f"  Total files: {total_files}")
            print(f"  Success: {success_count}")
            print(f"  Failed: {len(failed_files)}")
            
            if failed_files and len(failed_files) <= 10:
                print(f"  Failed files: {', '.join(failed_files)}")

        except Exception as e:
            print(f"Error in pendaftar_download_zip: {e}")
            import traceback
            traceback.print_exc()
            
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

