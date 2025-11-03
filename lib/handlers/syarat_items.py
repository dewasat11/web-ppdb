"""
API Handler untuk CRUD syarat_pendaftaran_items
"""
from http.server import BaseHTTPRequestHandler

from lib._supabase import supabase_client
from ._crud_helpers import (
    read_json_body,
    send_json,
    now_timestamp,
    allow_cors,
)


TABLE_NAME = "syarat_pendaftaran_items"
ORDER_FIELD = "order_index"


def _public():
    return supabase_client(service_role=False)


def _admin():
    return supabase_client(service_role=True)


class handler(BaseHTTPRequestHandler):
    @staticmethod
    def do_GET(request_handler):
        try:
            result = (
                _public()
                .table(TABLE_NAME)
                .select("*")
                .order(ORDER_FIELD, desc=False)
                .execute()
            )
            send_json(request_handler, 200, {"ok": True, "data": result.data or []})
        except Exception as exc:
            print(f"[SYARAT_ITEMS][GET] Error: {exc}")
            send_json(
                request_handler,
                500,
                {"ok": False, "error": f"Gagal mengambil data: {exc}"},
            )

    @staticmethod
    def do_POST(request_handler):
        try:
            payload = read_json_body(request_handler)
            name = (payload.get("name") or "").strip()
            order_index = payload.get(ORDER_FIELD)

            if not name:
                raise ValueError("Nama syarat wajib diisi")

            admin = _admin()
            if order_index is None:
                order_result = (
                    admin.table(TABLE_NAME)
                    .select(ORDER_FIELD)
                    .order(ORDER_FIELD, desc=True)
                    .limit(1)
                    .execute()
                )
                if order_result.data:
                    order_index = (order_result.data[0].get(ORDER_FIELD) or 0) + 1
                else:
                    order_index = 1

            insert_payload = {"name": name, ORDER_FIELD: order_index}
            result = admin.table(TABLE_NAME).insert(insert_payload).execute()
            created = result.data[0] if result.data else insert_payload

            send_json(
                request_handler,
                200,
                {"ok": True, "message": "Syarat berhasil ditambahkan", "data": created},
            )
        except Exception as exc:
            print(f"[SYARAT_ITEMS][POST] Error: {exc}")
            send_json(request_handler, 400, {"ok": False, "error": str(exc)})

    @staticmethod
    def do_PUT(request_handler):
        try:
            payload = read_json_body(request_handler)

            items = payload.get("items")
            if isinstance(items, list):
                updated = []
                admin = _admin()
                for idx, item in enumerate(items):
                    item_id = item.get("id")
                    if not item_id:
                        continue
                    new_order = item.get(ORDER_FIELD, idx + 1)
                    data = {ORDER_FIELD: int(new_order), "updated_at": now_timestamp()}
                    res = (
                        admin.table(TABLE_NAME)
                        .update(data)
                        .eq("id", item_id)
                        .execute()
                    )
                    if res.data:
                        updated.append(res.data[0])

                send_json(
                    request_handler,
                    200,
                    {
                        "ok": True,
                        "message": "Urutan syarat diperbarui",
                        "data": updated,
                    },
                )
                return

            item_id = payload.get("id")
            if not item_id:
                raise ValueError("Parameter id wajib disertakan")

            update_fields = {}
            if "name" in payload and payload["name"]:
                update_fields["name"] = payload["name"].strip()
            if ORDER_FIELD in payload and payload[ORDER_FIELD] is not None:
                update_fields[ORDER_FIELD] = int(payload[ORDER_FIELD])

            if not update_fields:
                raise ValueError("Tidak ada perubahan yang dikirim")

            update_fields["updated_at"] = now_timestamp()

            admin = _admin()
            result = (
                admin.table(TABLE_NAME)
                .update(update_fields)
                .eq("id", item_id)
                .execute()
            )

            updated = result.data[0] if result.data else None
            send_json(
                request_handler,
                200,
                {"ok": True, "message": "Syarat berhasil diperbarui", "data": updated},
            )
        except Exception as exc:
            print(f"[SYARAT_ITEMS][PUT] Error: {exc}")
            send_json(request_handler, 400, {"ok": False, "error": str(exc)})

    @staticmethod
    def do_DELETE(request_handler):
        try:
            payload = read_json_body(request_handler)
            item_id = payload.get("id")
            if not item_id:
                raise ValueError("Parameter id wajib disertakan")

            _admin().table(TABLE_NAME).delete().eq("id", item_id).execute()
            send_json(
                request_handler,
                200,
                {"ok": True, "message": "Syarat berhasil dihapus"},
            )
        except Exception as exc:
            print(f"[SYARAT_ITEMS][DELETE] Error: {exc}")
            send_json(request_handler, 400, {"ok": False, "error": str(exc)})

    @staticmethod
    def do_OPTIONS(request_handler):
        allow_cors(request_handler, ["GET", "POST", "PUT", "DELETE", "OPTIONS"])
