import re
text = open('temp.html', 'r', encoding='utf-8').read()
urls = re.findall(r'https://[^\s"\'>]*?\.jpg', text)
for u in set(urls):
    print(u)
