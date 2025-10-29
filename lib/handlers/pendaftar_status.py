from http.server import BaseHTTPRequestHandler
import json
from typing import Any, Dict
from lib._supabase import supabase_client
from lib.whatsapp_notifier import send_whatsapp_verification

class handler(BaseHTTPRequestHandler):
    def do_PATCH(self):
        """
        PATCH /api/pendaftar_status
        Body: { id: 123, status: "diterima" | "ditolak" | "pending" | "revisi", alasan?: "...", verifiedBy?: "admin@email.com" }
        Response: { success: true }
        """
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            
            # Validasi input wajib
            if not data.get('id'):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "id is required"
                }).encode())
                return
                
            if not data.get('status'):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "status is required"
                }).encode())
                return
            
            p_id = data["id"]
            p_status_input = data["status"]
            
            # Normalisasi status input (support both uppercase and lowercase)
            if isinstance(p_status_input, str):
                p_status_normalized = p_status_input.upper()
            else:
                p_status_normalized = str(p_status_input).upper()
                
            p_alasan = data.get("alasan", None)
            p_verified_by = data.get("verifiedBy", data.get("verifiedby", "admin"))
            
            # Map status ke nilai yang valid
            status_mapping = {
                'PENDING': 'PENDING',
                'REVISI': 'REVISI',
                'DITERIMA': 'DITERIMA',
                'DITOLAK': 'DITOLAK',
                'pending': 'PENDING',
                'revisi': 'REVISI',
                'diterima': 'DITERIMA',
                'ditolak': 'DITOLAK'
            }
            
            p_status = status_mapping.get(p_status_normalized, p_status_normalized)
            
            # Validasi status value
            valid_statuses = ['PENDING', 'REVISI', 'DITERIMA', 'DITOLAK']
            if p_status not in valid_statuses:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                }).encode())
                return
            
            # Update dengan service-role
            supa = supabase_client(service_role=True)
            
            # Prepare update payload dengan field yang konsisten
            update_payload: Dict[str, Any] = {
                "statusberkas": p_status,
            }
            
            # Add alasan/catatan if provided
            if p_alasan:
                update_payload["alasan"] = p_alasan
            
            # Add verified information for non-pending status
            if p_status != 'PENDING':
                update_payload["verifiedby"] = p_verified_by
                update_payload["verifiedat"] = "now()"  # Timestamp verifikasi
            
            # Execute update
            result = supa.table("pendaftar").update(update_payload).eq("id", p_id).execute()
            
            # Validasi hasil update
            if not result.data:  # type: ignore
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "Pendaftar tidak ditemukan"
                }).encode())
                return
            
            # ✨ KIRIM WHATSAPP NOTIFICATION jika status DITERIMA
            whatsapp_result = None
            if p_status == 'DITERIMA':
                try:
                    print(f"[VERIFIKASI] Status DITERIMA - sending WhatsApp notification...")
                    
                    # Get pendaftar data for notification
                    pendaftar_data = result.data[0] if result.data else None
                    
                    if pendaftar_data:
                        nama = pendaftar_data.get('namalengkap', '')
                        nisn = pendaftar_data.get('nisn', '')
                        nomor_hp = pendaftar_data.get('nomorhp', '')
                        
                        if nomor_hp and nama and nisn:
                            print(f"[VERIFIKASI] Sending WA to {nama} ({nomor_hp[:6]}...)")
                            
                            # Send WhatsApp notification
                            wa_response = send_whatsapp_verification(
                                phone=nomor_hp,
                                nama=nama,
                                nisn=nisn
                            )
                            
                            whatsapp_result = wa_response
                            
                            if wa_response.get("success"):
                                print(f"[VERIFIKASI] ✅ WhatsApp sent successfully via {wa_response.get('provider')}")
                            else:
                                print(f"[VERIFIKASI] ⚠️ WhatsApp failed: {wa_response.get('message')}")
                        else:
                            print(f"[VERIFIKASI] ⚠️ Missing data - HP: {bool(nomor_hp)}, Nama: {bool(nama)}, NISN: {bool(nisn)}")
                    else:
                        print("[VERIFIKASI] ⚠️ No pendaftar data returned")
                        
                except Exception as e:
                    print(f"[VERIFIKASI] ❌ WhatsApp notification error (non-critical): {e}")
                    # Don't fail the request if WhatsApp fails
            
            # Response success
            response_data = {
                "success": True,
                "message": f"Status pendaftar berhasil diubah menjadi {p_status}"
            }
            
            # Include WhatsApp status in response
            if whatsapp_result:
                response_data["whatsapp"] = {
                    "sent": whatsapp_result.get("success", False),
                    "provider": whatsapp_result.get("provider", "unknown"),
                    "message": whatsapp_result.get("message", "")
                }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": False,
                "error": str(e)
            }).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'PATCH, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()