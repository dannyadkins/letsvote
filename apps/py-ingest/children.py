from bs4 import BeautifulSoup

# Take in a BS4 object, return a list of child links
from urllib.parse import urljoin

def extract_links(current_url: str, data: str):
    soup = BeautifulSoup(data, 'html.parser')
    links = [link.get('href') for link in soup.find_all('a')]

    # get rid of any empty links and merge with current_url
    links = [urljoin(current_url, link) for link in links if link and len(link) > 0]

    return links
