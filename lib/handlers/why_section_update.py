"""
API Handler: POST /api/why_section_update
Update Why Section content (narasi)
"""
from http.server import BaseHTTPRequestHandler
import json
from lib._supabase import supabase_client

class handler(BaseHTTPRequestHandler):
    @staticmethod
    def do_POST(request_handler):
        try:
            content_length = int(request_handler.headers.get('Content-Length', 0))
            body = request_handler.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            print("[WHY_SECTION_UPDATE] Updating Why Section content...")
            print(f"[WHY_SECTION_UPDATE] Data: {data}")
            
            # Get Supabase client with service role for admin operations
            supa = supabase_client(service_role=True)
            
            # Extract fields
            title = data.get("title", "").strip()
            subtitle = data.get("subtitle", "").strip()
            content = data.get("content", "").strip()
            
            # Validate
            if not title or not content:
                raise ValueError("Title dan content harus diisi")
            
            # Check if record exists
            existing = supa.table("why_section").select("*").limit(1).execute()
            
            update_data = {
                "title": title,
                "subtitle": subtitle if subtitle else None,
                "content": content
            }
            
            if existing.data and len(existing.data) > 0:
                # Update existing record
                result = supa.table("why_section").update(update_data).eq("id", existing.data[0]["id"]).execute()
                print("[WHY_SECTION_UPDATE] ✅ Updated existing record")
            else:
                # Insert new record
                result = supa.table("why_section").insert(update_data).execute()
                print("[WHY_SECTION_UPDATE] ✅ Inserted new record")
            
            # Send success response
            request_handler.send_response(200)
            request_handler.send_header("Content-type", "application/json")
            request_handler.send_header("Access-Control-Allow-Origin", "*")
            request_handler.end_headers()
            
            response = {
                "ok": True,
                "message": "Why Section berhasil diupdate",
                "data": result.data[0] if result.data else update_data
            }
            
            request_handler.wfile.write(json.dumps(response).encode())
            print("[WHY_SECTION_UPDATE] ✅ Success")
            
        except Exception as e:
            print(f"[WHY_SECTION_UPDATE] ❌ Error: {e}")
            import traceback
            traceback.print_exc()
            
            request_handler.send_response(500)
            request_handler.send_header("Content-type", "application/json")
            request_handler.send_header("Access-Control-Allow-Origin", "*")
            request_handler.end_headers()
            
            request_handler.wfile.write(json.dumps({
                "ok": False,
                "error": str(e)
            }).encode())
    
    @staticmethod
    def do_OPTIONS(request_handler):
        request_handler.send_response(200)
        request_handler.send_header("Access-Control-Allow-Origin", "*")
        request_handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        request_handler.send_header("Access-Control-Allow-Headers", "Content-Type")
        request_handler.end_headers()

