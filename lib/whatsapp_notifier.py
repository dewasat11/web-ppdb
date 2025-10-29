"""
WhatsApp Notification Helper
Sends WhatsApp messages via Fonnte API (or other providers)

Setup:
1. Daftar di https://fonnte.com (atau provider lain seperti Wablas)
2. Dapatkan API Token
3. Set environment variable: WHATSAPP_API_TOKEN
4. (Optional) Set WHATSAPP_API_PROVIDER: "fonnte" | "wablas" | "woowa"
"""

import os
import requests
from typing import Optional, Dict, Any


def send_whatsapp_verification(
    phone: str,
    nama: str,
    nisn: str,
    check_status_url: str = "https://www.alikhsan-beji.app/cek-status.html"
) -> Dict[str, Any]:
    """
    Kirim notifikasi WhatsApp saat pendaftar DITERIMA (berkas terverifikasi)
    
    Args:
        phone: Nomor HP (format: 628123456789)
        nama: Nama lengkap pendaftar
        nisn: NISN pendaftar
        check_status_url: URL untuk cek status
    
    Returns:
        {
            "success": bool,
            "message": str,
            "provider": str,
            "response": dict (optional)
        }
    """
    try:
        # Get API credentials from environment
        api_token = os.getenv("WHATSAPP_API_TOKEN", "")
        provider = os.getenv("WHATSAPP_API_PROVIDER", "fonnte").lower()
        
        if not api_token:
            print("[WHATSAPP] ⚠️ WHATSAPP_API_TOKEN not set - skipping notification")
            return {
                "success": False,
                "message": "WhatsApp API token not configured",
                "provider": "none"
            }
        
        # Normalize phone number (remove +, spaces, hyphens)
        phone_clean = phone.replace("+", "").replace(" ", "").replace("-", "")
        
        # Ensure starts with 62 (Indonesia)
        if phone_clean.startswith("0"):
            phone_clean = "62" + phone_clean[1:]
        elif not phone_clean.startswith("62"):
            phone_clean = "62" + phone_clean
        
        # Build message template
        message = f"""*🎉 SELAMAT! Pendaftaran Anda TERVERIFIKASI*

Assalamu'alaikum {nama},

Kami dengan senang hati memberitahukan bahwa:

✅ *BERKAS PENDAFTARAN ANDA TELAH DIVERIFIKASI*

📋 *Detail:*
• Nama: {nama}
• NISN: {nisn}

📌 *LANGKAH SELANJUTNYA:*
Silakan lakukan pembayaran untuk menyelesaikan proses pendaftaran.

🔗 *Cek Status & Lanjut Pembayaran:*
{check_status_url}

⏰ Segera lakukan pembayaran untuk mengamankan tempat Anda.

Jika ada pertanyaan, silakan hubungi admin kami.

Jazakumullahu khairan,
*Panitia PPDSB Pondok Pesantren Al Ikhsan Beji*"""
        
        # Send via provider
        if provider == "fonnte":
            return _send_via_fonnte(api_token, phone_clean, message)
        elif provider == "wablas":
            return _send_via_wablas(api_token, phone_clean, message)
        elif provider == "woowa":
            return _send_via_woowa(api_token, phone_clean, message)
        else:
            return {
                "success": False,
                "message": f"Unknown provider: {provider}",
                "provider": provider
            }
    
    except Exception as e:
        print(f"[WHATSAPP] ❌ Error sending notification: {e}")
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "provider": provider if 'provider' in locals() else "unknown"
        }


def _send_via_fonnte(token: str, phone: str, message: str) -> Dict[str, Any]:
    """Send WhatsApp via Fonnte API"""
    try:
        url = "https://api.fonnte.com/send"
        
        headers = {
            "Authorization": token
        }
        
        payload = {
            "target": phone,
            "message": message,
            "countryCode": "62"
        }
        
        print(f"[WHATSAPP/FONNTE] Sending to {phone[:6]}...")
        
        response = requests.post(url, headers=headers, data=payload, timeout=10)
        result = response.json()
        
        print(f"[WHATSAPP/FONNTE] Response: {result}")
        
        # Fonnte returns {"status": true/false, ...}
        success = result.get("status", False) or response.status_code == 200
        
        return {
            "success": success,
            "message": "WhatsApp sent via Fonnte" if success else result.get("reason", "Failed"),
            "provider": "fonnte",
            "response": result
        }
    
    except Exception as e:
        print(f"[WHATSAPP/FONNTE] ❌ Error: {e}")
        return {
            "success": False,
            "message": f"Fonnte error: {str(e)}",
            "provider": "fonnte"
        }


def _send_via_wablas(token: str, phone: str, message: str) -> Dict[str, Any]:
    """Send WhatsApp via Wablas API"""
    try:
        # Wablas domain varies per user - get from env or use default
        domain = os.getenv("WABLAS_DOMAIN", "solo.wablas.com")
        url = f"https://{domain}/api/send-message"
        
        headers = {
            "Authorization": token
        }
        
        payload = {
            "phone": phone,
            "message": message
        }
        
        print(f"[WHATSAPP/WABLAS] Sending to {phone[:6]}...")
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        result = response.json()
        
        print(f"[WHATSAPP/WABLAS] Response: {result}")
        
        # Wablas returns {"status": true/false, ...}
        success = result.get("status", False) or response.status_code == 200
        
        return {
            "success": success,
            "message": "WhatsApp sent via Wablas" if success else result.get("message", "Failed"),
            "provider": "wablas",
            "response": result
        }
    
    except Exception as e:
        print(f"[WHATSAPP/WABLAS] ❌ Error: {e}")
        return {
            "success": False,
            "message": f"Wablas error: {str(e)}",
            "provider": "wablas"
        }


def _send_via_woowa(token: str, phone: str, message: str) -> Dict[str, Any]:
    """Send WhatsApp via Woowa.id API"""
    try:
        url = "https://api.woowa.id/api/v2/send-message"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "phone_number": phone,
            "message": message
        }
        
        print(f"[WHATSAPP/WOOWA] Sending to {phone[:6]}...")
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        result = response.json()
        
        print(f"[WHATSAPP/WOOWA] Response: {result}")
        
        success = result.get("status") == "success" or response.status_code == 200
        
        return {
            "success": success,
            "message": "WhatsApp sent via Woowa" if success else result.get("message", "Failed"),
            "provider": "woowa",
            "response": result
        }
    
    except Exception as e:
        print(f"[WHATSAPP/WOOWA] ❌ Error: {e}")
        return {
            "success": False,
            "message": f"Woowa error: {str(e)}",
            "provider": "woowa"
        }


# Alias for backward compatibility
send_wa_notification = send_whatsapp_verification

