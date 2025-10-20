from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import parse_qs, urlparse
from ._supabase import supabase_client
from typing import Any, Dict
import re

class handler(BaseHTTPRequestHandler):
    def _send_json(self, code: int, payload: Dict[str, Any]) -> None:
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode())

    def do_GET(self):
        """
        GET /api/pendaftar_cek_status?nomor=REG-20241014-000001
        Response: { success: true, data: {...} }
        """
        try:
            # Parse query parameters
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            nomor = (params.get("nomor", [""])[0] or "").strip()

            # Wajib diisi
            if not nomor:
                return self._send_json(400, {
                    "success": False,
                    "error": "Nomor registrasi harus diisi"
                })

            # Validasi format nomor registrasi (REG atau PREG)
            # Contoh: REG-20241014-000001 atau PREG-20241014-000001
            pattern = r'^(?:P?REG-\d{8}-\d{6})$'
            if not re.match(pattern, nomor.upper()):
                return self._send_json(400, {
                    "success": False,
                    "error": "Format nomor registrasi tidak valid. Gunakan format REG-YYYYMMDD-XXXXXX atau PREG-YYYYMMDD-XXXXXX"
                })

            # Query Supabase (pakai anon key / public access)
            supa = supabase_client(service_role=False)
            result = supa.table("pendaftar").select("*").eq("nomor_registrasi", nomor).execute()

            if not result.data:  # type: ignore
                return self._send_json(404, {
                    "success": False,
                    "error": "Nomor registrasi tidak ditemukan"
                })

            row: Dict[str, Any] = result.data[0]  # type: ignore

            # Transform data dengan field konsisten untuk frontend
            data = {
                "nomorRegistrasi": row.get("nomor_registrasi", ""),
                "nama": row.get("namalengkap", ""),
                "nik": row.get("nikcalon", ""),
                "tanggalLahir": row.get("tanggallahir", ""),
                "status": str(row.get("statusberkas", "PENDING")).lower(),
                "alasan": row.get("alasan") or row.get("deskripsistatus") or "",
                "createdat": row.get("createdat", ""),
                "telepon_orang_tua": row.get("telepon_orang_tua", ""),
                "email": row.get("emailcalon", ""),
                "alamat": ", ".join(filter(None, [
                    row.get("alamatjalan", ""),
                    row.get("desa", ""),
                    row.get("kecamatan", ""),
                    row.get("kotakabupaten", ""),
                    row.get("provinsi", "")
                ]))
            }

            return self._send_json(200, {"success": True, "data": data})

        except Exception as e:
            return self._send_json(500, {"success": False, "error": str(e)})

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
