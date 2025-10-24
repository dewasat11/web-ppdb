from http.server import BaseHTTPRequestHandler
import json
import base64
import re
from datetime import datetime
from io import BytesIO
from PIL import Image  # kompres gambar
from lib._supabase import supabase_client


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # === Read request body ===
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))

            file_base64 = data.get("file")
            file_name = data.get("fileName")
            file_type = data.get("fileType")
            nisn = data.get("nisn")

            print(f"[REQ] File: {file_name}, Type: {file_type}, NISN: {nisn}")

            # === Validasi input wajib ===
            if not all([file_base64, file_name, nisn]):
                return self._send_error(400, "Missing required fields: file, fileName, nisn")

            # === Validasi NISN ===
            if nisn == "undefined" or not nisn.strip():
                return self._send_error(400, "NISN tidak valid")

            if not re.match(r"^\d{10}$", nisn):
                return self._send_error(400, "Format NISN tidak valid. Harus 10 digit angka")

            # === Ambil base64 data (hilangkan prefix data:) ===
            if isinstance(file_base64, str) and file_base64.startswith("data:"):
                try:
                    file_base64 = file_base64.split(",", 1)[1]
                except Exception:
                    return self._send_error(400, "Format data URL tidak valid")

            # === Decode base64 ===
            try:
                file_data = base64.b64decode(file_base64)
            except Exception as e:
                return self._send_error(400, f"Gagal decode file: {str(e)}")

            print(f"[INFO] Decoded size: {len(file_data)} bytes")

            # === Validasi tipe file berdasar ekstensi ===
            allowed_extensions = ["jpg", "jpeg", "png", "pdf", "doc", "docx"]
            file_ext = (file_name.split(".")[-1] or "").lower()
            if file_ext not in allowed_extensions:
                return self._send_error(400, f"Tipe file tidak diizinkan. Hanya: {', '.join(allowed_extensions)}")

            # === KOMPres otomatis sesuai format (JPG/PNG) ===
            forced_mime = None
            if file_ext in ["jpg", "jpeg", "png"]:
                try:
                    file_data, file_ext, forced_mime = self._compress_image_keep_format(
                        file_data, target_kb=500, orig_ext=file_ext
                    )
                    print(f"[INFO] After compress: {len(file_data)} bytes, ext={file_ext}, mime={forced_mime}")
                except Exception as e:
                    print(f"[WARN] Kompres gagal, pakai file asli. Err: {e}")
                    forced_mime = None  # fallback

            # === Validasi ukuran maksimal 5MB setelah kompres ===
            if len(file_data) > 5 * 1024 * 1024:
                return self._send_error(400, "Ukuran file maksimal 5MB setelah kompres")

            # === Generate unique filename ===
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_filename = f"{nisn}/{file_type}_{timestamp}.{file_ext}"
            print(f"[INFO] Upload path: {unique_filename}")

            # === Upload ke Supabase Storage ===
            supa = supabase_client(service_role=True)

            mime_types = {
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "png": "image/png",
                "pdf": "application/pdf",
                "doc": "application/msword",
                "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            }
            content_type = forced_mime or mime_types.get(file_ext, "application/octet-stream")

            response = supa.storage.from_("pendaftar-files").upload(
                path=unique_filename,
                file=file_data,  # bytes
                file_options={"content-type": content_type},
            )
            print(f"[INFO] Upload response: {response}")

            # === Get public URL ===
            public_url = supa.storage.from_("pendaftar-files").get_public_url(unique_filename)
            print(f"[INFO] Public URL: {public_url}")

            # === Return success ===
            return self._send_json(200, {"ok": True, "url": public_url, "filename": unique_filename})

        except Exception as e:
            error_msg = str(e)
            print(f"[ERR] Upload error: {error_msg}")

            if "Bucket not found" in error_msg or "404" in error_msg:
                error_msg = "Storage bucket 'pendaftar-files' belum dibuat. Silakan buat bucket di Supabase Dashboard > Storage."
            elif "duplicate" in error_msg.lower():
                error_msg = "File dengan nama yang sama sudah ada."
            return self._send_error(500, error_msg)

    # --------------------------
    # Helpers
    # --------------------------
    def _send_error(self, code, msg):
        self.send_response(code)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": False, "error": msg}).encode())

    def _send_json(self, code, data):
        self.send_response(code)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _compress_image_keep_format(self, file_data: bytes, target_kb: int = 500, orig_ext: str = "jpg"):
        """
        Kompres gambar sesuai format asli:
        - JPG/JPEG: turunkan quality bertahap hingga ~target_kb (min quality 40) + optional downscale.
        - PNG: pertahankan PNG (termasuk transparansi), kompres via quantize + optimize + compress_level,
               lalu optional downscale bertahap jika masih besar.
        Return: (bytes_hasil, ext_out (sama dg input), mime_out)
        """
        ext = orig_ext.lower()

        if ext in ["jpg", "jpeg"]:
            img = Image.open(BytesIO(file_data)).convert("RGB")
            img = self._maybe_downscale(img, max_side=1600)

            quality = 85
            min_quality = 40
            best = None

            while True:
                buf = BytesIO()
                img.save(buf, format="JPEG", quality=quality, optimize=True)
                size_kb = buf.tell() / 1024
                print(f"[COMP-JPG] {size_kb:.1f} KB @q={quality}")
                best = buf.getvalue()

                if size_kb <= target_kb or quality <= min_quality:
                    break

                quality -= 5

            return best, ("jpeg" if ext == "jpeg" else "jpg"), "image/jpeg"

        elif ext == "png":
            img = Image.open(BytesIO(file_data))
            has_alpha = (img.mode in ("RGBA", "LA")) or ("transparency" in img.info)

            # Pertahankan mode agar alpha tetap ada
            if not has_alpha and img.mode not in ("RGB", "L", "P"):
                img = img.convert("RGB")

            img = self._maybe_downscale(img, max_side=1600)

            # Coba beberapa level quantize untuk kecilkan size
            palette_steps = [256, 128, 64]
            best_bytes = None
            best_size = float("inf")

            for colors in palette_steps:
                candidate = img
                if candidate.mode not in ("P", "L"):
                    if has_alpha:
                        # pisahkan alpha, quantize ke palet, lalu reapply alpha
                        rgb = candidate.convert("RGB")
                        q = rgb.quantize(colors=colors, method=Image.MEDIANCUT)
                        candidate = q.convert("RGBA")
                        candidate.putalpha(candidate.getchannel("A") if "A" in candidate.getbands() else 255)
                    else:
                        candidate = candidate.convert("RGB").quantize(colors=colors, method=Image.MEDIANCUT)

                buf = BytesIO()
                candidate.save(buf, format="PNG", optimize=True, compress_level=9)
                size_kb = buf.tell() / 1024
                print(f"[COMP-PNG] {size_kb:.1f} KB @colors={colors}")

                if size_kb < best_size:
                    best_size = size_kb
                    best_bytes = buf.getvalue()

                if size_kb <= target_kb:
                    break

            # Jika masih > target_kb, lakukan downscale bertahap (0.9x) max 4 kali
            tries = 0
            while best_size > target_kb and tries < 4:
                tries += 1
                w, h = img.size
                new_w = max(600, int(w * 0.9))
                new_h = max(600, int(h * 0.9))
                if new_w == w and new_h == h:
                    break
                img = img.resize((new_w, new_h), resample=Image.LANCZOS)

                buf = BytesIO()
                img_to_save = img
                if img_to_save.mode not in ("RGB", "L", "RGBA", "P"):
                    img_to_save = img_to_save.convert("RGBA" if has_alpha else "RGB")

                img_to_save.save(buf, format="PNG", optimize=True, compress_level=9)
                size_kb = buf.tell() / 1024
                print(f"[COMP-PNG-DS] {size_kb:.1f} KB @downscale#{tries}")
                if size_kb < best_size:
                    best_size = size_kb
                    best_bytes = buf.getvalue()

            # fallback: jika belum terisi (sangat kecil kemungkinan), pakai asli
            if best_bytes is None:
                best_bytes = file_data

            return best_bytes, "png", "image/png"

        else:
            # bukan gambar, kembalikan apa adanya
            return file_data, ext, None

    def _maybe_downscale(self, img: Image.Image, max_side: int = 1600) -> Image.Image:
        w, h = img.size
        if max(w, h) > max_side:
            if w >= h:
                new_w = max_side
                new_h = int(h * (max_side / w))
            else:
                new_h = max_side
                new_w = int(w * (max_side / h))
            return img.resize((new_w, new_h), resample=Image.LANCZOS)
        return img

    # Preflight CORS
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
