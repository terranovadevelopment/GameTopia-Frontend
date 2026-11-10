"""Run from GameTopia-Frontend root: python apply_update.py
Or pass a path to frontend root: python apply_update.py C:\\GameTopia-Frontend
Works offline; no build dependencies. Makes .before-how-to-play backups.
"""
from pathlib import Path
import shutil, sys

root = Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
source = Path(__file__).resolve().parent
pages = ('index.html', 'armageddon.html')
missing = [p for p in pages if not (root / p).is_file()]
if missing:
    sys.exit('Cannot update: frontend root missing ' + ', '.join(missing))
for p in ('README.txt', 'how-to-play.js'):
    shutil.copy2(source / p, root / p) if (source / p).resolve() != (root / p).resolve() else None
snippet = '<script src="how-to-play.js?v=howto1" defer></script>'
for name in pages:
    file = root / name
    html = file.read_text(encoding='utf-8')
    if snippet in html:
        print(f'{name}: already updated')
        continue
    if '</body>' not in html.lower():
        sys.exit(f'Cannot update {name}: missing </body>')
    shutil.copy2(file, file.with_name(name + '.before-how-to-play'))
    idx = html.lower().rfind('</body>')
    file.write_text(html[:idx] + snippet + html[idx:], encoding='utf-8')
    print(f'{name}: How to Play button installed')
print('Complete. Test index.html and armageddon.html; publish frontend files as usual.')
