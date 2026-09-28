import re
html = open('temp.html', 'r', encoding='utf-8').read()
matches = re.findall(r'url\([^)]+\)', html)
for m in set(matches):
    print("Found inline url:", m)
