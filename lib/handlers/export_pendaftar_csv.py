from http.server import BaseHTTPRequestHandler
import csv
from io import StringIO
from datetime import datetime
from lib._supabase import supabase_client


def sanitize_csv_value(value):
    """Sanitize value for CSV - trim whitespace, replace newlines/tabs"""
    if value is None:
        return ""
    
    # Convert to string and trim
    value_str = str(value).strip()
    
    # Replace newlines and tabs with spaces
    value_str = value_str.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    
    # Collapse multiple spaces
    while '  ' in value_str:
        value_str = value_str.replace('  ', ' ')
    
    # Remove potential CSV injection patterns
    if value_str and value_str[0] in ['=', '+', '-', '@']:
        value_str = "'" + value_str
    
    return value_str


def get_file_path(file_url):
    """Get file path/URL or empty string"""
    if file_url and isinstance(file_url, str) and file_url.strip():
        return file_url.strip()
    return ""


def build_alamat_lengkap(data):
    """Build smart full address from components"""
    parts = []
    
    # Jalan
    jalan = sanitize_csv_value(data.get('alamat_jalan') or data.get('alamat'))
    if jalan:
        parts.append(jalan)
    
    # RT/RW
    rt = sanitize_csv_value(data.get('rt'))
    rw = sanitize_csv_value(data.get('rw'))
    if rt and rw:
        parts.append(f"RT {rt}/RW {rw}")
    elif rt:
        parts.append(f"RT {rt}")
    elif rw:
        parts.append(f"RW {rw}")
    
    # Kelurahan
    kelurahan = sanitize_csv_value(data.get('kelurahan') or data.get('desa'))
    if kelurahan:
        parts.append(kelurahan)
    
    # Kecamatan
    kecamatan = sanitize_csv_value(data.get('kecamatan'))
    if kecamatan:
        parts.append(kecamatan)
    
    # Kota/Kabupaten (prioritas kota_kabupaten, fallback ke kabupaten)
    kota_kab = sanitize_csv_value(data.get('kota_kabupaten') or data.get('kabupaten'))
    if kota_kab:
        parts.append(kota_kab)
    
    # Provinsi
    provinsi = sanitize_csv_value(data.get('provinsi'))
    if provinsi:
        parts.append(provinsi)
    
    # Kode Pos
    kode_pos = sanitize_csv_value(data.get('kode_pos'))
    if kode_pos:
        parts.append(kode_pos)
    
    # Join with comma-space
    return ', '.join(parts)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """
        GET /api/export_pendaftar_csv
        Response: CSV file download
        """
        try:
            # Get Supabase client with service role for full access
            supa = supabase_client(service_role=True)

            # Query all pendaftar, ordered by nama
            result = (
                supa.table("pendaftar")
                .select("*")
                .order("namalengkap", desc=False)
                .execute()
            )

            if not result.data:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(
                    b'{"ok": false, "error": "Tidak ada data pendaftar"}'
                )
                return

            pendaftar_list = result.data

            # Create CSV in memory
            csv_buffer = StringIO()
            
            # Add UTF-8 BOM for Excel compatibility
            csv_buffer.write('\ufeff')
            
            # Define CSV writer with semicolon delimiter for Excel Indonesia
            csv_writer = csv.writer(
                csv_buffer,
                delimiter=';',
                quotechar='"',
                quoting=csv.QUOTE_MINIMAL,
                lineterminator='\r\n'  # CRLF for Excel
            )

            # Write header (exact as requested)
            headers = [
                'nisn',
                'nama',
                'tanggal_lahir',
                'tempat_lahir',
                'nama_ayah',
                'nama_ibu',
                'nomor_orangtua',
                'rencana_tingkat',
                'rencana_program',
                'alamat_jalan',
                'rt',
                'rw',
                'kelurahan',
                'kecamatan',
                'kota_kabupaten',
                'kabupaten',
                'provinsi',
                'kode_pos',
                'alamat_lengkap',
                'file_akte',
                'file_ijazah',
                'file_foto',
                'file_bpjs'
            ]
            csv_writer.writerow(headers)

            # Write data rows
            for pendaftar in pendaftar_list:
                # Extract and sanitize basic values
                nisn = sanitize_csv_value(pendaftar.get('nisn', ''))
                nama = sanitize_csv_value(pendaftar.get('namalengkap', ''))
                
                # Format tanggal_lahir as YYYY-MM-DD
                tanggal_lahir_raw = pendaftar.get('tanggallahir', '')
                if tanggal_lahir_raw:
                    try:
                        if isinstance(tanggal_lahir_raw, str):
                            if len(tanggal_lahir_raw) == 10 and tanggal_lahir_raw[4] == '-':
                                tanggal_lahir = tanggal_lahir_raw
                            else:
                                date_obj = datetime.fromisoformat(tanggal_lahir_raw.replace('Z', '+00:00'))
                                tanggal_lahir = date_obj.strftime('%Y-%m-%d')
                        else:
                            tanggal_lahir = str(tanggal_lahir_raw)
                    except:
                        tanggal_lahir = str(tanggal_lahir_raw) if tanggal_lahir_raw else ''
                else:
                    tanggal_lahir = ''
                
                tempat_lahir = sanitize_csv_value(pendaftar.get('tempatlahir', ''))
                nama_ayah = sanitize_csv_value(pendaftar.get('namaayah', ''))
                nama_ibu = sanitize_csv_value(pendaftar.get('namaibu', ''))
                
                # Preserve leading zeros in phone number (format as text)
                nomor_orangtua = sanitize_csv_value(pendaftar.get('telepon_orang_tua', ''))
                
                rencana_tingkat = sanitize_csv_value(pendaftar.get('rencanatingkat', ''))
                rencana_program = sanitize_csv_value(pendaftar.get('rencanaprogram', ''))
                
                # Address components
                alamat_jalan = sanitize_csv_value(pendaftar.get('alamat_jalan') or pendaftar.get('alamat', ''))
                rt = sanitize_csv_value(pendaftar.get('rt', ''))
                rw = sanitize_csv_value(pendaftar.get('rw', ''))
                kelurahan = sanitize_csv_value(pendaftar.get('kelurahan') or pendaftar.get('desa', ''))
                kecamatan = sanitize_csv_value(pendaftar.get('kecamatan', ''))
                kota_kabupaten = sanitize_csv_value(pendaftar.get('kota_kabupaten', ''))
                kabupaten = sanitize_csv_value(pendaftar.get('kabupaten', ''))
                provinsi = sanitize_csv_value(pendaftar.get('provinsi', ''))
                kode_pos = sanitize_csv_value(pendaftar.get('kode_pos', ''))
                
                # Build smart full address
                alamat_lengkap = build_alamat_lengkap(pendaftar)
                
                # Get file paths/URLs (not YA/TIDAK)
                file_akte = get_file_path(pendaftar.get('file_akta'))
                file_ijazah = get_file_path(pendaftar.get('file_ijazah'))
                file_foto = get_file_path(pendaftar.get('file_foto'))
                file_bpjs = get_file_path(pendaftar.get('file_bpjs'))

                # Write row
                row = [
                    nisn,
                    nama,
                    tanggal_lahir,
                    tempat_lahir,
                    nama_ayah,
                    nama_ibu,
                    nomor_orangtua,
                    rencana_tingkat,
                    rencana_program,
                    alamat_jalan,
                    rt,
                    rw,
                    kelurahan,
                    kecamatan,
                    kota_kabupaten,
                    kabupaten,
                    provinsi,
                    kode_pos,
                    alamat_lengkap,
                    file_akte,
                    file_ijazah,
                    file_foto,
                    file_bpjs
                ]
                csv_writer.writerow(row)

            # Get CSV content
            csv_content = csv_buffer.getvalue()
            csv_bytes = csv_content.encode('utf-8')

            # Generate filename with current date
            today = datetime.now().strftime('%Y%m%d')
            filename = f"pendaftar_{today}.csv"

            # Send CSV response
            self.send_response(200)
            self.send_header('Content-Type', 'text/csv; charset=utf-8')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(csv_bytes)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(csv_bytes)

            print(f"✓ CSV exported: {filename} ({len(pendaftar_list)} rows)")

        except Exception as e:
            print(f"Error in export_pendaftar_csv: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(
                f'{{"ok": false, "error": "{str(e)}"}}'.encode('utf-8')
            )

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

