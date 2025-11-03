"""
API Handler untuk kontak_settings (map embed, dsb)
"""
from http.server import BaseHTTPRequestHandler

from lib._supabase import supabase_client
from ._crud_helpers import read_json_body, send_json, now_timestamp, allow_cors


TABLE_NAME = "kontak_settings"


def _public():
    return supabase_client(service_role=False)


def _admin():
    return supabase_client(service_role=True)


class handler(BaseHTTPRequestHandler):
    @staticmethod
    def do_GET(request_handler):
        try:
            result = _public().table(TABLE_NAME).select("*").limit(1).execute()
            data = result.data[0] if result.data else {}
            send_json(request_handler, 200, {"ok": True, "data": data})
        except Exception as exc:
            print(f"[KONTAK_SETTINGS][GET] Error: {exc}")
            send_json(
                request_handler, 500, {"ok": False, "error": f"Gagal mengambil data: {exc}"}
            )

    @staticmethod
    def do_POST(request_handler):
        try:
            payload = read_json_body(request_handler)
            map_url = (payload.get("map_embed_url") or "").strip()
            if not map_url:
                raise ValueError("map_embed_url wajib diisi")

            admin = _admin()
            existing = admin.table(TABLE_NAME).select("id").limit(1).execute()

            if existing.data:
                record_id = existing.data[0]["id"]
                result = (
                    admin.table(TABLE_NAME)
                    .update({"map_embed_url": map_url, "updated_at": now_timestamp()})
                    .eq("id", record_id)
                    .execute()
                )
                data = result.data[0] if result.data else {"id": record_id, "map_embed_url": map_url}
            else:
                result = (
                    admin.table(TABLE_NAME)
                    .insert({"map_embed_url": map_url})
                    .execute()
                )
                data = result.data[0] if result.data else {"map_embed_url": map_url}

            send_json(
                request_handler,
                200,
                {"ok": True, "message": "Pengaturan kontak tersimpan", "data": data},
            )
        except Exception as exc:
            print(f"[KONTAK_SETTINGS][POST] Error: {exc}")
            send_json(request_handler, 400, {"ok": False, "error": str(exc)})

    @staticmethod
    def do_OPTIONS(request_handler):
        allow_cors(request_handler, ["GET", "POST", "OPTIONS"])
