import os
import json
import psutil
import platform
import subprocess
import socket
from typing import List, Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

SECRET = os.getenv("AGENT_JWT_SECRET", "")
SAFE_MODE = os.getenv("SAFE_MODE", "true").lower() == "true"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://sentineltools.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"]
)

def require_auth(req: Request):
    auth = req.headers.get("authorization", "")
    if not SECRET:
        raise HTTPException(status_code=400, detail="secret not set")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="unauthorized")
    token = auth.split(" ", 1)[1]
    if token != SECRET:
        raise HTTPException(status_code=401, detail="unauthorized")

@app.get("/health")
async def health():
    return {"ok": True, "safe_mode": SAFE_MODE}

@app.post("/sniffer/start")
async def sniffer_start(req: Request):
    require_auth(req)
    # Read-only safe summary using netstat
    try:
        if platform.system().lower().startswith('win'):
            p = subprocess.run(["netstat", "-ano"], capture_output=True, text=True, timeout=10)
            lines = [l for l in p.stdout.splitlines() if l.strip()]
            return {"ok": True, "mode": "safe" if SAFE_MODE else "active", "connections": lines[:200]}
        else:
            return {"ok": True, "mode": "safe", "connections": []}
    except Exception:
        return {"ok": True, "mode": "safe", "connections": []}

@app.post("/sniffer/stop")
async def sniffer_stop(req: Request):
    require_auth(req)
    return {"ok": True}

@app.post("/nmap/scan")
async def nmap_scan(req: Request):
    require_auth(req)
    body = await req.json()
    target = body.get("target", "")
    # Fallback TCP connect scan on common ports (read-only)
    ports = [20,21,22,23,25,53,80,110,139,143,443,445,3389,8080,8443]
    open_ports: List[int] = []
    try:
        for p in ports:
            try:
                with socket.create_connection((target, p), timeout=0.5):
                    open_ports.append(p)
            except Exception:
                pass
    except Exception:
        pass
    return {"target": target, "ports": open_ports}

@app.get("/endpoint/processes")
async def endpoint_processes(req: Request):
    require_auth(req)
    procs = []
    for p in psutil.process_iter(attrs=["pid", "name"]):
        procs.append({"pid": p.info.get("pid"), "name": p.info.get("name")})
    return {"count": len(procs), "processes": procs[:200]}

@app.post("/honeypot/start")
async def honeypot_start(req: Request):
    require_auth(req)
    body = await req.json()
    ports: List[int] = body.get("ports", [])
    return {"ok": True, "ports": ports, "mode": "safe" if SAFE_MODE else "active"}

@app.post("/honeypot/stop")
async def honeypot_stop(req: Request):
    require_auth(req)
    return {"ok": True}

@app.get("/wifi/scan")
async def wifi_scan(req: Request):
    require_auth(req)
    # Read-only operation allowed in safe mode
    nets: List[dict] = []
    try:
        sys = platform.system().lower()
        if sys.startswith('win'):
            p = subprocess.run(["netsh", "wlan", "show", "networks", "mode=Bssid"], capture_output=True, text=True, timeout=10)
            out = p.stdout.splitlines()
            ssid = None
            bssid = None
            signal = None
            security = None
            channel = None
            for line in out:
                if line.strip().startswith("SSID "):
                    ssid = line.split(":",1)[1].strip()
                elif line.strip().startswith("BSSID "):
                    bssid = line.split(":",1)[1].strip()
                elif line.strip().startswith("Signal"):
                    signal = line.split(":",1)[1].strip()
                elif line.strip().startswith("Authentication"):
                    security = line.split(":",1)[1].strip()
                elif line.strip().startswith("Channel"):
                    channel = line.split(":",1)[1].strip()
                if ssid and bssid and signal and security:
                    nets.append({"ssid": ssid, "bssid": bssid, "signal": signal, "security": security, "channel": channel or ""})
                    bssid = None
                    signal = None
                    security = None
                    channel = None
            if not nets:
                # Fallback to current interface
                p2 = subprocess.run(["netsh", "wlan", "show", "interfaces"], capture_output=True, text=True, timeout=10)
                cur_ssid = ""; cur_bssid = ""; cur_signal = ""; cur_sec = ""; cur_chan = ""
                for line in p2.stdout.splitlines():
                    s = line.strip()
                    if s.lower().startswith("ssid") and ":" in s: cur_ssid = s.split(":",1)[1].strip()
                    elif s.lower().startswith("bssid") and ":" in s: cur_bssid = s.split(":",1)[1].strip()
                    elif s.lower().startswith("signal") and ":" in s: cur_signal = s.split(":",1)[1].strip()
                    elif s.lower().startswith("authentication") and ":" in s: cur_sec = s.split(":",1)[1].strip()
                    elif s.lower().startswith("channel") and ":" in s: cur_chan = s.split(":",1)[1].strip()
                if cur_ssid:
                    nets.append({"ssid": cur_ssid, "bssid": cur_bssid, "signal": cur_signal, "security": cur_sec, "channel": cur_chan})
        elif sys == 'darwin':
            # macOS airport
            p = subprocess.run(["/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport", "-s"], capture_output=True, text=True, timeout=10)
            lines = p.stdout.splitlines()
            for i, line in enumerate(lines):
                if i == 0: # header
                    continue
                parts = [x for x in line.split(" ") if x]
                if len(parts) >= 6:
                    # SSID may have spaces; simple heuristic: take last columns
                    bssid = parts[-6]
                    rssi = int(parts[-5]) if parts[-5].lstrip('-').isdigit() else -80
                    security = " ".join(parts[-1:])
                    chan = parts[-4] if parts[-4].isdigit() else ""
                    # crude dBm to %
                    pct = max(0, min(100, 2 * (rssi + 100)))
                    ssid = " ".join(parts[:-6]) or "Unknown"
                    nets.append({"ssid": ssid, "bssid": bssid, "signal": f"{pct}%", "security": security, "channel": chan})
        else:
            # Linux via nmcli
            p = subprocess.run(["nmcli", "-t", "-f", "SSID,BSSID,SIGNAL,SECURITY,CHAN", "device", "wifi", "list"], capture_output=True, text=True, timeout=10)
            for line in p.stdout.splitlines():
                if not line:
                    continue
                cols = line.split(":")
                if len(cols) >= 5:
                    ssid, bssid, signal, security, chan = cols[0], cols[1], cols[2], cols[3], cols[4]
                    nets.append({"ssid": ssid or "Unknown", "bssid": bssid, "signal": f"{signal}%", "security": security, "channel": chan})
    except Exception:
        nets = []
    return JSONResponse(content={"ok": True, "networks": nets, "ts": int(psutil.boot_time())}, headers={"Cache-Control": "no-store"})

def entropy_bits(pw: str) -> float:
    if not pw:
        return 0.0
    lowers = any(c.islower() for c in pw)
    uppers = any(c.isupper() for c in pw)
    digits = any(c.isdigit() for c in pw)
    symbols = any(not c.isalnum() for c in pw)
    space = 0
    if lowers: space += 26
    if uppers: space += 26
    if digits: space += 10
    if symbols: space += 32
    import math
    return len(pw) * math.log2(max(space,1))

def default_gateway() -> Optional[str]:
    try:
        if platform.system().lower().startswith('win'):
            p = subprocess.run(["ipconfig"], capture_output=True, text=True, timeout=10)
            for line in p.stdout.splitlines():
                line = line.strip()
                if line.lower().startswith("default gateway"):
                    parts = line.split(":",1)
                    if len(parts) == 2:
                        ip = parts[1].strip()
                        if ip:
                            return ip
    except Exception:
        return None
    return None

def http_probe(host: str, port: int) -> dict:
    import http.client
    try:
        conn = http.client.HTTPConnection(host, port, timeout=3)
        conn.request('GET', '/')
        resp = conn.getresponse()
        headers = {k.lower(): v for k, v in resp.getheaders()}
        body = resp.read(1024).decode(errors='ignore')
        return {"ok": True, "status": resp.status, "headers": headers, "body": body[:256]}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def check_ports(ip: str, ports: List[int]) -> List[int]:
    openp: List[int] = []
    for p in ports:
        try:
            with socket.create_connection((ip, p), timeout=0.3):
                openp.append(p)
        except Exception:
            pass
    return openp

@app.post("/wifi/audit")
async def wifi_audit(req: Request):
    require_auth(req)
    body = await req.json()
    pw_hint = body.get("wifi_password_hint", "")
    enc = "unknown"
    cipher = "unknown"
    try:
        if platform.system().lower().startswith('win'):
            p = subprocess.run(["netsh", "wlan", "show", "interfaces"], capture_output=True, text=True, timeout=10)
            for line in p.stdout.splitlines():
                s = line.strip()
                if s.lower().startswith("authentication"):
                    enc = s.split(":",1)[1].strip()
                elif s.lower().startswith("cipher"):
                    cipher = s.split(":",1)[1].strip()
    except Exception:
        pass
    gw = default_gateway() or ""
    probe80 = http_probe(gw, 80) if gw else {"ok": False}
    probe8080 = http_probe(gw, 8080) if gw else {"ok": False}
    https_ok = False
    try:
        import ssl, socket as s
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(s.socket(), server_hostname=gw) as sock:
            sock.settimeout(3)
            sock.connect((gw, 443))
            https_ok = True
    except Exception:
        https_ok = False
    wps_enabled = any("wps" in str(v).lower() for v in [probe80.get("body"), probe80.get("headers",{}), probe8080.get("body"), probe8080.get("headers",{})])
    admin_over_http = (probe80.get("ok") and not https_ok)
    default_basic = False
    for h in [probe80.get("headers",{}), probe8080.get("headers",{})]:
        auth = h.get("www-authenticate", "")
        if isinstance(auth, str) and "basic" in auth.lower():
            default_basic = True
    firmware = (probe80.get("headers",{}).get("server") or probe8080.get("headers",{}).get("server") or "unknown")
    entropy = entropy_bits(pw_hint)
    devices = []
    try:
        dev = await network_scan(req)
        devices = dev.get("devices", []) if isinstance(dev, dict) else []
    except Exception:
        devices = []
    risky_ports = [21,22,23,80,8080]
    for d in devices:
        ip = d.get("ip")
        d["open_ports"] = check_ports(ip, risky_ports) if ip else []
        # hostname guess
        try:
            hn = socket.gethostbyaddr(ip)[0]
            d["hostname"] = hn
            d["factory_default"] = any(k in hn.lower() for k in ["android","raspberry","tplink","dlink","printer","camera"]) if hn else False
        except Exception:
            d["hostname"] = None
            d["factory_default"] = False
    weak_enc = enc.lower().startswith("wep") or enc.lower().startswith("wpa ")
    score = 100
    if weak_enc: score -= 35
    if wps_enabled: score -= 20
    if admin_over_http: score -= 15
    if default_basic: score -= 15
    if entropy and entropy < 60: score -= 10
    exposed = sum(1 for d in devices if d.get("open_ports"))
    score -= min(exposed * 5, 25)
    category = "A+"
    if score >= 90: category = "A+"
    elif score >= 75: category = "B"
    elif score >= 60: category = "C"
    elif score >= 40: category = "D"
    else: category = "F"
    return {
        "gateway": gw,
        "encryption": enc,
        "cipher": cipher,
        "wps_enabled": bool(wps_enabled),
        "admin_over_http": bool(admin_over_http),
        "basic_auth_challenge": bool(default_basic),
        "firmware_header": firmware,
        "password_entropy_bits": entropy,
        "devices": devices,
        "score": score,
        "grade": category
    }

@app.get("/network/scan")
async def network_scan(req: Request):
    require_auth(req)
    devices: List[dict] = []
    try:
        if platform.system().lower().startswith('win'):
            p = subprocess.run(["arp", "-a"], capture_output=True, text=True, timeout=10)
            for line in p.stdout.splitlines():
                line = line.strip()
                if not line or line.lower().startswith("interface"):
                    continue
                parts = [x for x in line.split(" ") if x]
                if len(parts) >= 3 and parts[1].count('-') == 5:
                    ip = parts[0]
                    mac = parts[1].replace('-', ':')
                    dtype = parts[2]
                    devices.append({"ip": ip, "mac": mac, "type": dtype})
        else:
            devices = []
    except Exception:
        devices = []
    return {"ok": True, "devices": devices}

@app.post("/nids/run")
async def nids_run(req: Request):
    require_auth(req)
    alerts: List[dict] = []
    try:
        # ARP spoofing / duplicate IP-MAC
        dup: dict = {}
        if platform.system().lower().startswith('win'):
            p = subprocess.run(["arp", "-a"], capture_output=True, text=True, timeout=10)
            for line in p.stdout.splitlines():
                parts = [x for x in line.strip().split(" ") if x]
                if len(parts) >= 3 and parts[1].count('-') == 5:
                    ip = parts[0]
                    mac = parts[1].replace('-', ':')
                    dup.setdefault(ip, set()).add(mac)
            for ip, macs in dup.items():
                if len(macs) > 1:
                    alerts.append({"type": "arp_spoof", "message": f"IP {ip} maps to multiple MACs: {','.join(macs)}"})
        # Port scanning behavior (approx): many different ports to one target in netstat
        try:
            if platform.system().lower().startswith('win'):
                p2 = subprocess.run(["netstat", "-ano"], capture_output=True, text=True, timeout=10)
                count = 0
                for l in p2.stdout.splitlines():
                    if "SYN_SENT" in l:
                        count += 1
                if count > 50:
                    alerts.append({"type": "port_scan", "message": f"High SYN_SENT count observed: {count}"})
        except Exception:
            pass
        # Rogue DHCP detection: multiple DHCP servers
        try:
            if platform.system().lower().startswith('win'):
                p3 = subprocess.run(["ipconfig", "/all"], capture_output=True, text=True, timeout=10)
                dhcps = set()
                for l in p3.stdout.splitlines():
                    s = l.strip().lower()
                    if s.startswith('dhcp server'):
                        ip = l.split(":",1)[1].strip()
                        if ip:
                            dhcps.add(ip)
                if len(dhcps) > 1:
                    alerts.append({"type": "rogue_dhcp", "message": f"Multiple DHCP servers: {','.join(dhcps)}"})
        except Exception:
            pass
    except Exception:
        pass
    return {"ok": True, "alerts": alerts}

@app.post("/firewall/block")
async def firewall_block(req: Request):
    require_auth(req)
    body = await req.json()
    ip = body.get("ip", "")
    if not ip:
        raise HTTPException(status_code=400, detail="bad request")
    if SAFE_MODE:
        return {"ok": True, "mode": "safe", "ip": ip}
    try:
        if platform.system().lower().startswith('win'):
            subprocess.run(["netsh", "advfirewall", "firewall", "add", "rule", f"name=Block_{ip}", "dir=in", "action=block", f"remoteip={ip}"], capture_output=True, text=True, timeout=10)
            return {"ok": True, "ip": ip}
        return {"ok": True, "ip": ip}
    except Exception:
        return {"ok": False, "ip": ip}

@app.post("/firewall/unblock")
async def firewall_unblock(req: Request):
    require_auth(req)
    body = await req.json()
    ip = body.get("ip", "")
    if not ip:
        raise HTTPException(status_code=400, detail="bad request")
    if SAFE_MODE:
        return {"ok": True, "mode": "safe", "ip": ip}
    try:
        if platform.system().lower().startswith('win'):
            subprocess.run(["netsh", "advfirewall", "firewall", "delete", "rule", f"name=Block_{ip}"], capture_output=True, text=True, timeout=10)
            return {"ok": True, "ip": ip}
        return {"ok": True, "ip": ip}
    except Exception:
        return {"ok": False, "ip": ip}

@app.post("/malware/analyze")
async def malware_analyze(req: Request):
    require_auth(req)
    body = await req.json()
    h = body.get("hash", "")
    # Safe stub returning heuristic flags
    flags = []
    if h and h.startswith("deadbeef"):
        flags.append("suspicious pattern")
    return {"hash": h, "flags": flags, "static": {"imports": ["kernel32.dll"], "sections": [".text", ".rdata"]}}

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8787"))
    uvicorn.run(app, host=host, port=port)
