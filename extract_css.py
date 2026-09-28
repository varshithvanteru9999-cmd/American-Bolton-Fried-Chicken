import re
import urllib.request

html = open('temp.html', 'r', encoding='utf-8').read()
css_links = re.findall(r'href=[\"\']?(/fh\.app-[^\s\"\'>]+\.css)', html)

for css in css_links:
    css_url = f"https://favouritechickenms.co.uk{css}"
    try:
        req = urllib.request.Request(css_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            css_content = response.read().decode('utf-8')
            bg_urls = re.findall(r'url\((.*?)\)', css_content)
            for bg in bg_urls:
                bg = bg.strip('"\'')
                print(f"Found in {css}: {bg}")
    except Exception as e:
        print(f"Failed to fetch {css_url}: {e}")
