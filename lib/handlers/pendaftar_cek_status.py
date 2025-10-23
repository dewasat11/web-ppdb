from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import parse_qs, urlparse
from lib._supabase import supabase_client
from typing import Any, Dict, Optional

class handler(BaseHTTPRequestHandler):
    def _send_json(self, code: int, payload: Dict[str, Any]) -> None:
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(payload, default=str).encode())

    def do_GET(self):
        """
        GET /api/pendaftar_cek_status?nisn=1234567890
        Response: { ok: true, data: {...} | null }
        """
        try:
            # Parse query parameters
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            nisn = (params.get("nisn", [""])[0] or "").strip()

            # Validasi: NISN wajib diisi
            if not nisn:
                return self._send_json(400, {
                    "ok": False,
                    "error": "NISN harus diisi"
                })

            # Validasi: NISN harus 10 digit angka
            if len(nisn) != 10 or not nisn.isdigit():
                return self._send_json(400, {
                    "ok": False,
                    "error": "Format NISN tidak valid (10 digit)"
                })

            # Query Supabase dengan SERVICE_ROLE
            supa = supabase_client(service_role=True)
            result = supa.table("pendaftar").select(
                "nisn,namalengkap,statusberkas,verifiedby,verifiedat,createdat,updatedat"
            ).eq("nisn", nisn).execute()

            # Jika tidak ditemukan, return 200 dengan data: null
            if not result.data:
                return self._send_json(200, {
                    "ok": True,
                    "data": None
                })

            row: Dict[str, Any] = result.data[0]

            # Transform sesuai spec
            data = {
                "nisn": row.get("nisn", ""),
                "nama": row.get("namalengkap", ""),
                "status": row.get("statusberkas") or "PENDING",
                "verified_by": row.get("verifiedby"),
                "verified_at": row.get("verifiedat"),
                "created_at": row.get("createdat"),
                "updated_at": row.get("updatedat")
            }

            return self._send_json(200, {"ok": True, "data": data})

        except Exception as e:
            print(f"Error in pendaftar_cek_status: {str(e)}")
            return self._send_json(500, {
                "ok": False,
                "error": "Internal server error",
                "detail": str(e)
            })

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
