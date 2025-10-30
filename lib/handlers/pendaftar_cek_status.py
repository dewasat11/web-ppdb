from http.server import BaseHTTPRequestHandler
import json
import traceback
from urllib.parse import parse_qs, urlparse
from lib._supabase import supabase_client
from typing import Any, Dict

class handler(BaseHTTPRequestHandler):
    @staticmethod
    def do_GET(request_handler):
        """
        GET /api/pendaftar_cek_status?nisn=1234567890
        Response: { ok: true, data: {...} | null }
        """
        def send_json(code: int, payload: Dict[str, Any]) -> None:
            """Send JSON response"""
            try:
                request_handler.send_response(code)
                request_handler.send_header("Content-Type", "application/json")
                request_handler.send_header("Access-Control-Allow-Origin", "*")
                request_handler.end_headers()
                request_handler.wfile.write(json.dumps(payload, default=str).encode())
            except Exception as e:
                print(f"Error sending JSON: {e}")
        
        try:
            print(f"[CEK_STATUS] Request path: {request_handler.path}")
            
            # Parse query parameters
            parsed = urlparse(request_handler.path)
            params = parse_qs(parsed.query)
            nisn = (params.get("nisn", [""])[0] or "").strip()
            
            print(f"[CEK_STATUS] NISN: {nisn}")

            # Validasi: NISN wajib diisi
            if not nisn:
                print("[CEK_STATUS] Error: NISN kosong")
                return send_json(400, {
                    "ok": False,
                    "error": "NISN harus diisi"
                })

            # Validasi: NISN harus 10 digit angka
            if len(nisn) != 10 or not nisn.isdigit():
                print(f"[CEK_STATUS] Error: NISN invalid format - {nisn}")
                return send_json(400, {
                    "ok": False,
                    "error": "Format NISN tidak valid (10 digit)"
                })

            print("[CEK_STATUS] Connecting to Supabase...")
            
            # Query Supabase dengan SERVICE_ROLE
            try:
                supa = supabase_client(service_role=True)
                print("[CEK_STATUS] Supabase client created")
            except Exception as e:
                print(f"[CEK_STATUS] Error creating Supabase client: {e}")
                return send_json(500, {
                    "ok": False,
                    "error": "Database connection error",
                    "detail": str(e)
                })

            print(f"[CEK_STATUS] Querying pendaftar with nisn={nisn}")
            
            try:
                result = supa.table("pendaftar").select(
                    "nisn,namalengkap,tanggallahir,tempatlahir,statusberkas,alasan,verifiedby,verifiedat,createdat,updatedat"
                ).eq("nisn", nisn).execute()
                
                print(f"[CEK_STATUS] Query result: {len(result.data) if result.data else 0} rows")
            except Exception as e:
                print(f"[CEK_STATUS] Error querying database: {e}")
                traceback.print_exc()
                return send_json(500, {
                    "ok": False,
                    "error": "Database query error",
                    "detail": str(e)
                })

            # Jika tidak ditemukan, return 200 dengan data: null
            if not result.data:
                print("[CEK_STATUS] NISN tidak ditemukan")
                return send_json(200, {
                    "ok": True,
                    "data": None
                })

            row: Dict[str, Any] = result.data[0]
            print(f"[CEK_STATUS] Found data for: {row.get('namalengkap')}")
            print(f"[CEK_STATUS] Catatan Admin (alasan): {row.get('alasan')}")

            # Query data pembayaran juga
            pembayaran_data = None
            try:
                print(f"[CEK_STATUS] Querying pembayaran with nisn={nisn}")
                pembayaran_result = supa.table("pembayaran").select(
                    "nisn,nik,nama,metode_pembayaran,jumlah,bukti_bayar_url,status_pembayaran,verified_by,catatan_admin,tanggal_verifikasi,created_at,updated_at"
                ).eq("nisn", nisn).execute()
                
                if pembayaran_result.data and len(pembayaran_result.data) > 0:
                    pembayaran_row = pembayaran_result.data[0]
                    pembayaran_data = {
                        "nisn": pembayaran_row.get("nisn", ""),
                        "nik": pembayaran_row.get("nik", ""),
                        "nama": pembayaran_row.get("nama", ""),
                        "metode_pembayaran": pembayaran_row.get("metode_pembayaran", ""),
                        "jumlah": pembayaran_row.get("jumlah", 0),
                        "bukti_bayar_url": pembayaran_row.get("bukti_bayar_url", ""),
                        "status_pembayaran": pembayaran_row.get("status_pembayaran", "PENDING"),
                        "verified_by": pembayaran_row.get("verified_by", ""),
                        "catatan_admin": pembayaran_row.get("catatan_admin", ""),
                        "tanggal_verifikasi": pembayaran_row.get("tanggal_verifikasi"),
                        "created_at": pembayaran_row.get("created_at"),
                        "updated_at": pembayaran_row.get("updated_at")
                    }
                    print(f"[CEK_STATUS] Pembayaran found: status={pembayaran_data['status_pembayaran']}")
                else:
                    print("[CEK_STATUS] Pembayaran belum ada untuk NISN ini")
            except Exception as e:
                print(f"[CEK_STATUS] Warning: Error querying pembayaran: {e}")
                # Continue even if pembayaran query fails

            # Transform sesuai spec
            data = {
                "nisn": row.get("nisn", ""),
                "nama": row.get("namalengkap", ""),
                "tanggalLahir": row.get("tanggallahir"),
                "tempatLahir": row.get("tempatlahir"),
                "status": row.get("statusberkas") or "PENDING",
                "alasan": row.get("alasan"),  # Catatan admin
                "verified_by": row.get("verifiedby"),
                "verified_at": row.get("verifiedat"),
                "created_at": row.get("createdat"),
                "createdat": row.get("createdat"),  # Add both formats for compatibility
                "updated_at": row.get("updatedat"),
                "pembayaran": pembayaran_data  # Tambahkan data pembayaran
            }

            print("[CEK_STATUS] Sending success response")
            return send_json(200, {"ok": True, "data": data})

        except Exception as e:
            print(f"[CEK_STATUS] Unexpected error: {str(e)}")
            traceback.print_exc()
            return send_json(500, {
                "ok": False,
                "error": "Internal server error",
                "detail": str(e)
            })

    @staticmethod
    def do_OPTIONS(request_handler):
        """Handle CORS preflight"""
        request_handler.send_response(200)
        request_handler.send_header("Access-Control-Allow-Origin", "*")
        request_handler.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        request_handler.send_header("Access-Control-Allow-Headers", "Content-Type")
        request_handler.end_headers()
