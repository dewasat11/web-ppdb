from http.server import BaseHTTPRequestHandler
import csv
from io import StringIO
from datetime import datetime
from .._supabase import supabase_client


def sanitize_csv_value(value):
    """Sanitize value for CSV to prevent injection and handle special chars"""
    if value is None:
        return ""
    
    # Convert to string
    value_str = str(value).strip()
    
    # Remove potential CSV injection patterns
    if value_str and value_str[0] in ['=', '+', '-', '@', '\t', '\r']:
        value_str = "'" + value_str
    
    return value_str


def check_file_exists(file_url):
    """Check if file URL exists (not null/empty)"""
    if file_url and isinstance(file_url, str) and file_url.strip():
        # Check if it's a valid URL (starts with http)
        if file_url.startswith('http://') or file_url.startswith('https://'):
            return "YA"
    return "TIDAK"


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
            
            # Define CSV writer
            csv_writer = csv.writer(
                csv_buffer,
                delimiter=',',
                quotechar='"',
                quoting=csv.QUOTE_MINIMAL,
                lineterminator='\n'
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
                'file_akte',
                'file_ijazah',
                'file_foto',
                'file_bpjs'
            ]
            csv_writer.writerow(headers)

            # Write data rows
            for pendaftar in pendaftar_list:
                # Extract and sanitize values
                nisn = sanitize_csv_value(pendaftar.get('nisn', ''))
                nama = sanitize_csv_value(pendaftar.get('namalengkap', ''))
                
                # Format tanggal_lahir as YYYY-MM-DD
                tanggal_lahir_raw = pendaftar.get('tanggallahir', '')
                if tanggal_lahir_raw:
                    # Try to parse and format date
                    try:
                        if isinstance(tanggal_lahir_raw, str):
                            # If already in YYYY-MM-DD format
                            if len(tanggal_lahir_raw) == 10 and tanggal_lahir_raw[4] == '-':
                                tanggal_lahir = tanggal_lahir_raw
                            else:
                                # Try to parse other formats
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
                nomor_orangtua = sanitize_csv_value(pendaftar.get('telepon_orang_tua', ''))
                rencana_tingkat = sanitize_csv_value(pendaftar.get('rencanatingkat', ''))
                rencana_program = sanitize_csv_value(pendaftar.get('rencanaprogram', ''))
                
                # Check file existence (YA/TIDAK)
                file_akte = check_file_exists(pendaftar.get('file_akta'))
                file_ijazah = check_file_exists(pendaftar.get('file_ijazah'))
                file_foto = check_file_exists(pendaftar.get('file_foto'))
                file_bpjs = check_file_exists(pendaftar.get('file_bpjs'))

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
            filename = f"pendaftar_all_{today}.csv"

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

