import requests
from bs4 import BeautifulSoup
import os
from urllib.parse import urljoin

BASE = "https://financialservices.gov.in"

# Important sections to scrape
SECTIONS = [
    BASE + "/beta/en/important-links",
    BASE + "/beta/en/acts-and-rules",
    BASE + "/beta/en/circulars",
    BASE + "/beta/en/notifications",
    BASE + "/beta/en/reports",
    BASE + "/beta/en/publications",
    BASE + "/beta/en/whats-new",
]

# SAVE DIRECTORY → C DRIVE
OUTPUT_DIR = r"C:\dfs_pdfs"

def get_soup(url):
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")

def extract_pdf_links(soup, page_url):
    pdfs = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        # Only PDFs
        if href.lower().endswith(".pdf"):
            full_url = urljoin(page_url, href)
            pdfs.append(full_url)
    return pdfs

def download_pdf(url):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filename = url.split("/")[-1]

    path = os.path.join(OUTPUT_DIR, filename)
    try:
        r = requests.get(url, timeout=25)
        r.raise_for_status()
        with open(path, "wb") as f:
            f.write(r.content)
        print("Downloaded:", filename)
    except Exception as e:
        print("Error:", url, "|", e)

def main():
    all_pdfs = set()

    for section in SECTIONS:
        print("\n🔍 Checking:", section)
        try:
            soup = get_soup(section)
            pdfs = extract_pdf_links(soup, section)
            for p in pdfs:
                all_pdfs.add(p)
        except Exception as e:
            print("⚠️ Failed to load section:", section, "|", e)

    print("\n📌 Total PDFs found:", len(all_pdfs))
    print("⏬ Starting download...\n")

    for pdf in all_pdfs:
        download_pdf(pdf)

    print("\n✅ DONE! PDFs saved in:", OUTPUT_DIR)

if __name__ == "__main__":
    main()
