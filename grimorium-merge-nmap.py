#!/usr/bin/env python3
"""
grimorium-merge-nmap.py
Layer real open-port data onto the ARP-derived config so each host gets the
RIGHT probe per service, and hosts with nothing probeable get dropped.

PIPELINE
  1) extract targets from the live config (private IPs only):
       python3 grimorium-merge-nmap.py --config grimorium-live.json --targets-out targets.txt
     (prints the exact nmap command to run)
  2) scan them on a LAN host:
       sudo nmap -sS -sV --open -oX scan.xml -iL targets.txt -p <ports>
  3) merge scan + config into a new config:
       python3 grimorium-merge-nmap.py --config grimorium-live.json --scan scan.xml > grimorium-scanned.json

WHY PER-PORT PROBES (see grimorium src/js/probes.js)
  https  : opaque no-cors fetch. Confirms an HTTP(S) listener "answered". Use for
           web ports. Build https:// for TLS ports, http:// otherwise.
  ws-tcp : WebSocket-handshake TCP probe. The only generic "is this port open"
           signal a browser has. Use for every non-web TCP port (ssh, smb, rdp,
           printer raw, db, mqtt...). Fast TCP reply = ok; silent-hold = false bad.
  doh / https-cors are intentionally NOT auto-assigned: doh only resolves public
           names (your .lan names won't), and https-cors needs the target to send
           CORS headers (LAN gear doesn't). Upgrade specific links by hand in the UI.

  Net effect: anything with an open port becomes a truthful card; cloud-only IoT
  (Ring/Nest/Echo/Switch) has no open TCP port from your LAN and is dropped, so it
  stops inflating the SEVER count. Names and classifier sigils are carried over.

ORIGIN REMINDER
  Serve the built index.html over plain http on the LAN (python3 -m http.server),
  not from the https GitHub Pages URL, or the browser blocks every http:// probe
  as mixed content and you are back to a wall of LOST.
"""

import argparse
import ipaddress
import json
import re
import sys
import xml.etree.ElementTree as ET

# TLS web ports -> https:// liveness.
HTTPS_PORTS = {443, 8443, 9443, 10443, 5001, 8006, 4443, 7443, 1311}
# Plain web ports -> http:// liveness.
HTTP_PORTS = {80, 8080, 8000, 8888, 8081, 3000, 5000, 8096, 8123, 32400,
              9000, 9090, 9091, 7878, 8989, 8686, 5601, 631, 8123}


def is_web(portid, svc):
    s = (svc or "").lower()
    return portid in HTTPS_PORTS or portid in HTTP_PORTS or "http" in s


def is_tls(portid, svc):
    s = (svc or "").lower()
    return portid in HTTPS_PORTS or "https" in s or "ssl" in s or "tls" in s


def link_for_port(ip, portid, svc):
    """The correct probe + target for one open port."""
    label = f"{svc or 'tcp'}:{portid}"
    if is_web(portid, svc):
        scheme = "https" if is_tls(portid, svc) else "http"
        if (scheme == "http" and portid == 80) or (scheme == "https" and portid == 443):
            target = f"{scheme}://{ip}/"
        else:
            target = f"{scheme}://{ip}:{portid}/"
        return {"name": label, "probe": "https", "target": target}
    # everything else: generic TCP liveness
    return {"name": label, "probe": "ws-tcp", "target": f"{ip}:{portid}"}


def order_key(link):
    """Web first, ssh next, then the rest — so the most useful link leads the card."""
    t = link["target"]
    if link["probe"] == "https":
        return (0, t)
    if link["name"].startswith("ssh") or t.endswith(":22"):
        return (1, t)
    return (2, t)


def parse_scan(xml_path):
    """nmap -oX -> { ip: [(portid, service_name), ...] } for open TCP ports."""
    tree = ET.parse(xml_path)
    hosts = {}
    for host in tree.getroot().findall("host"):
        st = host.find("status")
        if st is not None and st.get("state") == "down":
            continue
        ip = None
        for a in host.findall("address"):
            if a.get("addrtype") == "ipv4":
                ip = a.get("addr")
                break
        if not ip:
            continue
        ports_el = host.find("ports")
        open_ports = []
        if ports_el is not None:
            for p in ports_el.findall("port"):
                stt = p.find("state")
                if stt is None or stt.get("state") != "open":
                    continue
                svc = p.find("service")
                name = svc.get("name") if svc is not None else ""
                try:
                    open_ports.append((int(p.get("portid")), name))
                except (TypeError, ValueError):
                    pass
        if open_ports:
            hosts[ip] = sorted(open_ports)
    return hosts


def private_ips_from_config(cfg):
    out = []
    for ch in cfg.get("chains", []):
        try:
            if ipaddress.ip_address(ch["address"]).is_private:
                out.append(ch["address"])
        except ValueError:
            pass
    # stable, de-duped
    seen, uniq = set(), []
    for ip in out:
        if ip not in seen:
            seen.add(ip)
            uniq.append(ip)
    return uniq


def do_merge(cfg, scan):
    # Index config chains by address to carry over name + sigils.
    by_ip = {ch["address"]: ch for ch in cfg.get("chains", [])}
    OCTET_SITE = {0: "VMF LAN", 1: "Home LAN", 2: "L2TP VPN", 3: "Pentagon City LAN"}
    site_cls = {cl["name"]: cl["id"] for cl in cfg.get("classifiers", [])}

    new_chains = []
    kept_cls_ids = set()
    for ip in sorted(scan, key=lambda s: tuple(int(o) for o in s.split("."))):
        ports = scan[ip]
        links = sorted((link_for_port(ip, p, s) for p, s in ports), key=order_key)
        src = by_ip.get(ip)
        if src:
            name = src["name"]
            cids = list(src.get("classifierIds", []))
        else:
            # host nmap saw that wasn't in the config: name = IP, add its site sigil if known
            name = ip
            cids = []
            site = OCTET_SITE.get(int(ip.split(".")[2]))
            if site in site_cls:
                cids.append(site_cls[site])
        kept_cls_ids.update(cids)
        new_chains.append({
            "name": name, "address": ip, "haltOnFail": False,
            "classifierIds": cids, "links": links,
        })

    # Keep only classifiers still referenced by a surviving chain.
    classifiers = [cl for cl in cfg.get("classifiers", []) if cl["id"] in kept_cls_ids]

    dropped = [ch["address"] for ch in cfg.get("chains", []) if ch["address"] not in scan]
    return {
        "chains": new_chains,
        "classifiers": classifiers,
        "positions": {},
        "groupByTag": cfg.get("groupByTag", True),
        "timeoutMs": cfg.get("timeoutMs", 5000),
        "parallel": cfg.get("parallel", 6),
    }, new_chains, dropped


def main():
    ap = argparse.ArgumentParser(description="Merge nmap open-port data into a grimorium config")
    ap.add_argument("--config", required=True, help="ARP/DHCP-derived grimorium JSON (names + sigils)")
    ap.add_argument("--scan", help="nmap -oX XML to merge")
    ap.add_argument("--targets-out", help="write private target IPs here and print the nmap command, then exit")
    args = ap.parse_args()

    with open(args.config, encoding="utf-8") as f:
        cfg = json.load(f)

    if args.targets_out:
        ips = private_ips_from_config(cfg)
        with open(args.targets_out, "w") as f:
            f.write("\n".join(ips) + "\n")
        ports = "22,80,111,139,443,445,515,548,631,1311,1883,3000,3306,3389,5000,5001,5432,8006,8080,8081,8096,8123,8443,8989,9000,9090,9100,10000,32400"
        print(f"wrote {len(ips)} targets to {args.targets_out}", file=sys.stderr)
        print(f"sudo nmap -sS -sV --open -oX scan.xml -iL {args.targets_out} -p {ports}", file=sys.stderr)
        return

    if not args.scan:
        sys.exit("need --scan scan.xml (or --targets-out to generate the scan target list first)")

    scan = parse_scan(args.scan)
    merged, chains, dropped = do_merge(cfg, scan)
    json.dump(merged, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    print(f"// {len(chains)} probeable hosts kept, {len(dropped)} dropped (no open port): "
          + ", ".join(dropped[:12]) + (" ..." if len(dropped) > 12 else ""), file=sys.stderr)


if __name__ == "__main__":
    main()
