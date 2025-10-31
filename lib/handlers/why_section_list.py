"""
API Handler: GET /api/why_section_list
Fetch Why Section content (narasi)
"""
from http.server import BaseHTTPRequestHandler
import json
from lib._supabase import supabase_client

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            print("[WHY_SECTION_LIST] Fetching Why Section content...")
            
            # Get Supabase client
            supa = supabase_client(service_role=False)
            
            # Fetch Why Section content (assuming table name: why_section)
            result = supa.table("why_section").select("*").limit(1).execute()
            
            print(f"[WHY_SECTION_LIST] Found {len(result.data) if result.data else 0} records")
            
            # Send success response
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            if result.data and len(result.data) > 0:
                response = {
                    "ok": True,
                    "data": result.data[0]
                }
            else:
                # Return default content if no data found
                response = {
                    "ok": True,
                    "data": {
                        "title": "Mengapa Memilih Pondok Pesantren Al Ikhsan Beji?",
                        "subtitle": "Pendidikan islami terpadu: tahfidz Al-Qur'an, akhlak mulia, dan ilmu pengetahuan",
                        "content": "Bergabunglah dengan Pondok Pesantren Al Ikhsan Beji untuk mendapatkan pendidikan islami terpadu yang membentuk karakter santri yang berakhlak mulia. Program tahfidz Al-Qur'an dengan metode terbukti akan membimbing santri menghafal Al-Qur'an dengan tartil dan pemahaman makna. Dengan pendampingan 24 jam, kami membentuk karakter santri yang ta'at beribadah dan santun dalam pergaulan. Fasilitas asrama yang nyaman dilengkapi dengan masjid, ruang belajar, perpustakaan, dan fasilitas olahraga yang lengkap untuk mendukung proses belajar mengajar yang optimal."
                    }
                }
            
            self.wfile.write(json.dumps(response).encode())
            print("[WHY_SECTION_LIST] ✅ Success")
            
        except Exception as e:
            print(f"[WHY_SECTION_LIST] ❌ Error: {e}")
            
            self.send_response(500)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            self.wfile.write(json.dumps({
                "ok": False,
                "error": str(e)
            }).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

