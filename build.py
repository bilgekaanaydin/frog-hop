# Bundles src/ into a single index.html (the playable file) and refreshes frog-hop.zip.
import os, zipfile
os.chdir(os.path.dirname(os.path.abspath(__file__)))
html = open('src/index.html').read()
out = html.replace('<script src="assets.js"></script>\n<script src="game.js"></script>',
                   '<script>\n' + open('src/assets.js').read() + '\n</script>\n<script>\n' + open('src/game.js').read() + '\n</script>')
assert '<script>' in out
import datetime
out = out.replace("'__BUILD__'", "'" + datetime.datetime.now(datetime.timezone.utc).strftime('%m.%d %H:%M') + "'", 1)  # version stamp for the title screen
open('index.html', 'w').write(out)
with zipfile.ZipFile('frog-hop.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    z.write('index.html', 'frog-hop.html')
    for root, _, files in os.walk('src'):
        for f in files: z.write(os.path.join(root, f))
    for f in os.listdir('assets'): z.write(os.path.join('assets', f))
    z.write('README.md')
print('bundled', len(out), 'bytes')
