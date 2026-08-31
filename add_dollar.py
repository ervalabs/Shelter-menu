import re

html_path = r'd:\Documentos del Usuario\Usuario\Desktop\Erva Labs\Proyectos\SHELTER BAR\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

def replacer(match):
    inner = match.group(2)
    if not inner.startswith('$'):
        if inner.startswith('+ '):
            new_inner = '+ $' + inner[2:]
        else:
            new_inner = '$' + inner
        return match.group(1) + new_inner + match.group(3)
    return match.group(0)

html = re.sub(r'(<span class="[^"]*price[^"]*">)(.*?)(</span>)', replacer, html)
html = re.sub(r'(Todas las artesanales a <strong>)(8000)(</strong>)', r'\g<1>$\g<2>\g<3>', html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
