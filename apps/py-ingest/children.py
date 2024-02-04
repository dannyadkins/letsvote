from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

def extract_links(current_url: str, soup: BeautifulSoup):
    links = [link.get('href') for link in soup.find_all('a')]

    # Normalize links by ignoring fragments
    links = [urljoin(current_url, link) for link in links if link]
    links = [urlparse(link)._replace(fragment='').geturl() for link in links if not link.endswith('#')]

    return list(set(links))  # Remove duplicates
