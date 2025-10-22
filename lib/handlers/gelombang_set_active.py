from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime
from lib._supabase import supabase_client


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """
        POST /api/set_gelombang_active
        Body: { id: number }
        Response: Success message
        Atomic: Set all is_active=false, then set is_active=true WHERE id=:id
        """
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({
                        "ok": False,
                        "error": "Request body is required"
                    }).encode('utf-8')
                )
                return

            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            
            # Validate required field
            gelombang_id = data.get('id')
            
            if not gelombang_id:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({
                        "ok": False,
                        "error": "Missing required field: id"
                    }).encode('utf-8')
                )
                return
            
            # Get Supabase client with service role
            supa = supabase_client(service_role=True)
            
            # Step 1: Deactivate all gelombang
            deactivate_result = (
                supa.table("gelombang")
                .update({
                    "is_active": False,
                    "updated_at": datetime.now().isoformat()
                })
                .neq("id", 0)  # Update all rows
                .execute()
            )
            
            print(f"✓ All gelombang deactivated: {len(deactivate_result.data) if deactivate_result.data else 0} rows")
            
            # Step 2: Activate specified gelombang
            activate_result = (
                supa.table("gelombang")
                .update({
                    "is_active": True,
                    "updated_at": datetime.now().isoformat()
                })
                .eq("id", gelombang_id)
                .execute()
            )
            
            if not activate_result.data:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({
                        "ok": False,
                        "error": f"Gelombang dengan id {gelombang_id} tidak ditemukan"
                    }).encode('utf-8')
                )
                return
            
            activated_gelombang = activate_result.data[0]
            
            # Send success response
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(
                json.dumps({
                    "ok": True,
                    "data": activated_gelombang,
                    "message": f"{activated_gelombang.get('nama', 'Gelombang')} berhasil diaktifkan"
                }).encode('utf-8')
            )
            
            print(f"✓ Gelombang activated: id={gelombang_id}")

        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(
                json.dumps({
                    "ok": False,
                    "error": "Invalid JSON format"
                }).encode('utf-8')
            )
        except Exception as e:
            print(f"Error in set_gelombang_active: {e}")
            import traceback
            traceback.print_exc()
            
            # Check if it's a unique constraint violation
            error_message = str(e)
            if "unique" in error_message.lower() or "constraint" in error_message.lower():
                self.send_response(409)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({
                        "ok": False,
                        "error": "Konflik: Hanya satu gelombang yang boleh aktif"
                    }).encode('utf-8')
                )
            else:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    json.dumps({
                        "ok": False,
                        "error": str(e)
                    }).encode('utf-8')
                )

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

