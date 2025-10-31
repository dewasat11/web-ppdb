"""
API Handler: GET /api/why_section_list
Fetch Why Section content (narasi)
"""
from http.server import BaseHTTPRequestHandler
import json
from lib._supabase import supabase_client

class handler(BaseHTTPRequestHandler):
    @staticmethod
    def do_GET(request_handler):
        try:
            print("[WHY_SECTION_LIST] Fetching Why Section content...")
            
            # Get Supabase client
            supa = supabase_client(service_role=False)
            
            # Default content (fallback if table doesn't exist or query fails)
            default_data = {
                "title": "Mengapa Memilih Pondok Pesantren Al Ikhsan Beji?",
                "subtitle": "Pendidikan islami terpadu: tahfidz Al-Qur'an, akhlak mulia, dan ilmu pengetahuan",
                "content": "Bergabunglah dengan Pondok Pesantren Al Ikhsan Beji untuk mendapatkan pendidikan islami terpadu yang membentuk karakter santri yang berakhlak mulia. Program tahfidz Al-Qur'an dengan metode terbukti akan membimbing santri menghafal Al-Qur'an dengan tartil dan pemahaman makna. Dengan pendampingan 24 jam, kami membentuk karakter santri yang ta'at beribadah dan santun dalam pergaulan. Fasilitas asrama yang nyaman dilengkapi dengan masjid, ruang belajar, perpustakaan, dan fasilitas olahraga yang lengkap untuk mendukung proses belajar mengajar yang optimal."
            }
            
            # Try to fetch from database
            try:
                result = supa.table("why_section").select("*").limit(1).execute()
                print(f"[WHY_SECTION_LIST] Found {len(result.data) if result.data else 0} records")
                
                if result.data and len(result.data) > 0:
                    data = result.data[0]
                    response = {
                        "ok": True,
                        "data": {
                            "title": data.get("title", default_data["title"]),
                            "subtitle": data.get("subtitle", default_data["subtitle"]),
                            "content": data.get("content", default_data["content"])
                        }
                    }
                else:
                    # No data in table, return default
                    print("[WHY_SECTION_LIST] ⚠️ No data found, returning default")
                    response = {
                        "ok": True,
                        "data": default_data
                    }
            except Exception as db_error:
                # Table might not exist or other DB error
                error_msg = str(db_error)
                print(f"[WHY_SECTION_LIST] ⚠️ Database error (table may not exist): {error_msg}")
                
                # Check if it's a table not found error
                if "why_section" in error_msg.lower() or "not found" in error_msg.lower() or "PGRST205" in error_msg:
                    print("[WHY_SECTION_LIST] ⚠️ Table 'why_section' not found - returning default content")
                    # Return default content instead of error (graceful fallback)
                    response = {
                        "ok": True,
                        "data": default_data,
                        "warning": "Table 'why_section' belum dibuat. Silakan jalankan SQL script di sql/create_table_why_section.sql"
                    }
                else:
                    # Re-raise other errors
                    raise db_error
            
            # Send success response
            request_handler.send_response(200)
            request_handler.send_header("Content-type", "application/json")
            request_handler.send_header("Access-Control-Allow-Origin", "*")
            request_handler.end_headers()
            
            request_handler.wfile.write(json.dumps(response).encode())
            print("[WHY_SECTION_LIST] ✅ Success")
            
        except Exception as e:
            print(f"[WHY_SECTION_LIST] ❌ Error: {e}")
            import traceback
            traceback.print_exc()
            
            # Send error response with default data as fallback
            request_handler.send_response(200)  # Return 200 with error flag instead of 500
            request_handler.send_header("Content-type", "application/json")
            request_handler.send_header("Access-Control-Allow-Origin", "*")
            request_handler.end_headers()
            
            # Return default content even on error (graceful degradation)
            request_handler.wfile.write(json.dumps({
                "ok": True,  # Set to True so frontend doesn't break
                "data": {
                    "title": "Mengapa Memilih Pondok Pesantren Al Ikhsan Beji?",
                    "subtitle": "Pendidikan islami terpadu: tahfidz Al-Qur'an, akhlak mulia, dan ilmu pengetahuan",
                    "content": "Bergabunglah dengan Pondok Pesantren Al Ikhsan Beji untuk mendapatkan pendidikan islami terpadu yang membentuk karakter santri yang berakhlak mulia. Program tahfidz Al-Qur'an dengan metode terbukti akan membimbing santri menghafal Al-Qur'an dengan tartil dan pemahaman makna. Dengan pendampingan 24 jam, kami membentuk karakter santri yang ta'at beribadah dan santun dalam pergaulan. Fasilitas asrama yang nyaman dilengkapi dengan masjid, ruang belajar, perpustakaan, dan fasilitas olahraga yang lengkap untuk mendukung proses belajar mengajar yang optimal."
                },
                "error": str(e)  # Include error for debugging
            }).encode())
    
    @staticmethod
    def do_OPTIONS(request_handler):
        request_handler.send_response(200)
        request_handler.send_header("Access-Control-Allow-Origin", "*")
        request_handler.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        request_handler.send_header("Access-Control-Allow-Headers", "Content-Type")
        request_handler.end_headers()

