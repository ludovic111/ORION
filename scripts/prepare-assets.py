"""Prepare original OFPP symbols and a bounded, locally served swisstopo cache."""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import json
import math
import re
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SYMBOL_URL = (
    "https://www.babs.admin.ch/dam/fr/sd-web/89hcDN8xXWLQ/"
    "2026-Zivile%20Signaturen%20svg-fr.zip"
)
LAYERS = {
    "gray": "ch.swisstopo.pixelkarte-grau",
    "color": "ch.swisstopo.pixelkarte-farbe",
    "aerial": "ch.swisstopo.swissimage",
}
BOUNDS = {"west": 5.90, "south": 46.10, "east": 6.35, "north": 46.40}


def download(url, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".partial")
    subprocess.run(
        [
            "curl", "--retry", "2", "--connect-timeout", "15", "--max-time", "90",
            "-fsSL", url, "-o", str(temporary),
        ],
        check=True,
    )
    temporary.replace(destination)


def prepare_symbols():
    with tempfile.TemporaryDirectory(prefix="orion-symbols-") as directory:
        archive = Path(directory) / "official.zip"
        download(SYMBOL_URL, archive)
        items = []
        destination = ROOT / "public/symbols"
        destination.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(archive) as bundle:
            for name in bundle.namelist():
                if not name.lower().endswith(".svg") or "__MACOSX" in name:
                    continue
                content = bundle.read(name)
                if re.search(rb"<script|<foreignObject|\son\w+\s*=", content, re.I):
                    raise ValueError("Unsafe SVG: " + name)
                identifier = hashlib.sha256(name.encode()).hexdigest()[:16]
                (destination / f"{identifier}.svg").write_bytes(content)
                group = re.sub(r"^\d+\.?\s*", "", name.split("/")[1])
                label = re.sub(r"^\d+[a-z]?-", "", Path(name).stem).replace("-", " ")
                items.append({
                    "id": identifier, "name": label, "group": group, "path": name,
                    "sha256": hashlib.sha256(content).hexdigest(),
                })
        (destination / "catalog.json").write_text(
            json.dumps(items, ensure_ascii=False, indent=2)
        )
        # Keep the verified source edition explicit; updating editions requires review.
        provenance = {
            "source": SYMBOL_URL,
            "edition": "2026-03-27",
            "retrieved": "2026-09-18",
            "archive_sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
            "files": len(items),
        }
        (ROOT / "docs/symbols-provenance.json").write_text(json.dumps(provenance, indent=2))
        print("Official symbols:", len(items))


def tile(lon, lat, zoom):
    scale = 2 ** zoom
    x = int((lon + 180) / 360 * scale)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * scale)
    return x, y


def prepare_tile(job):
    zoom, x, y = job
    for name, layer in LAYERS.items():
        path = ROOT / f"public/tiles/{name}/{zoom}/{x}/{y}.jpeg"
        if path.exists():
            continue
        url = f"https://wmts.geo.admin.ch/1.0.0/{layer}/default/current/3857/{zoom}/{x}/{y}.jpeg"
        download(url, path)
        if not path.read_bytes().startswith(b"\xff\xd8"):
            path.unlink()
            raise ValueError("Invalid JPEG received: " + url)


def main():
    prepare_symbols()
    jobs = []
    for zoom in range(11, 15):
        x0, y1 = tile(BOUNDS["west"], BOUNDS["south"], zoom)
        x1, y0 = tile(BOUNDS["east"], BOUNDS["north"], zoom)
        jobs.extend(
            (zoom, x, y)
            for x in range(x0, x1 + 1)
            for y in range(y0, y1 + 1)
        )
    with ThreadPoolExecutor(max_workers=6) as executor:
        list(executor.map(prepare_tile, jobs))
    print("Local swisstopo tiles:", len(jobs) * len(LAYERS))


if __name__ == "__main__":
    main()
