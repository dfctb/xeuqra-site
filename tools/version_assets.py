#!/usr/bin/env python3
"""Refresh content-based asset URLs after editing CSS, JS, fonts or media.

Run from anywhere: python3 tools/version_assets.py
No third-party dependencies and no build step are needed to serve the site.
"""
from pathlib import Path
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
ASSET_URL = re.compile(
    r'(?P<url>(?:/assets/|\.\./assets/)[A-Za-z0-9_./-]+\.'
    r'(?:png|jpe?g|webp|ico|woff2|otf|ttf|mp4|glb))(?:\?v=[a-f0-9]+)?'
    r'|(?P<favicon>/favicon\.ico)(?:\?v=[a-f0-9]+)?'
)
CODE_URL = re.compile(r'(?P<url>/(?:js|css)/[A-Za-z0-9_./-]+\.(?:js|css))(?:\?v=[a-f0-9]+)?')


def versioned(match, owner):
    url = match.group('url') or match.groupdict().get('favicon')
    target = ROOT / url.lstrip('/') if url.startswith('/') else owner.parent / url
    if not target.is_file():
        raise FileNotFoundError(f'{owner.relative_to(ROOT)} references missing asset {url}')
    digest = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
    return f'{url}?v={digest}'


def main():
    documents = [ROOT / 'index.html', *(ROOT / 'pages').rglob('*.html'),
                 *(ROOT / 'admin').glob('*.html'), *(ROOT / 'css').glob('*.css'),
                 *(ROOT / 'js').glob('*.js'), *(ROOT / 'data').glob('*.json')]
    changed = 0
    for document in documents:
        original = document.read_text()
        updated = ASSET_URL.sub(lambda match: versioned(match, document), original)
        if updated != original:
            document.write_text(updated)
            changed += 1
    # Script/style hashes are computed after their own media/font URLs are updated.
    for document in (p for p in documents if p.suffix == '.html'):
        original = document.read_text()
        updated = CODE_URL.sub(lambda match: versioned(match, document), original)
        if updated != original:
            document.write_text(updated)
            changed += 1
    print(f'Asset versions refreshed in {changed} files.')


if __name__ == '__main__':
    main()
