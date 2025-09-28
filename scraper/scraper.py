import requests
from bs4 import BeautifulSoup
import json
import time
import re
import os
from openai import OpenAI, RateLimitError

BASE_URL = "https://www.byggstart.no"

client = OpenAI(api_key="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")

def get_soup(url):
    response = requests.get(url)
    response.raise_for_status()
    return BeautifulSoup(response.text, 'html.parser')

def extract_categories():
    soup = get_soup(BASE_URL + "/kategori")
    categories = {}
    # Find category links
    for a in soup.find_all('a', href=re.compile(r'/kategori/')):
        href = a['href']
        if href.startswith('/kategori/'):
            slug = href.split('/kategori/')[1]
            if slug and slug not in categories:
                categories[slug] = {
                    'name': a.get_text(strip=True),
                    'url': BASE_URL + href
                }
    return categories

def extract_price_guides(category_url):
    soup = get_soup(category_url)
    price_guides = {}
    # Find price guide links under ## Prisguider
    pris_section = soup.find('h2', string='Prisguider')
    if pris_section:
        ul = pris_section.find_next('ul') or pris_section.find_next_sibling()
        if ul:
            for a in ul.find_all('a', href=re.compile(r'/pris/')):
                href = a['href']
                title = a.get_text(strip=True)
                slug = href.split('/pris/')[1]
                if slug:
                    price_guides[slug] = {
                        'title': title,
                        'url': BASE_URL + href
                    }
    return price_guides

def extract_price_data(price_guide_url):
    soup = get_soup(price_guide_url)
    # Extract main content, perhaps the article or main div
    content = soup.find('main') or soup.find('article') or soup
    text = content.get_text(separator='\n', strip=True)
    
    # Limit text to 1000 words for AI
    words = text.split()
    text_limited = ' '.join(words[:1000]) if len(words) > 1000 else text
    
    # Use AI to extract prices with context
    prices_with_context = []
    if client.api_key:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "Du er en hjelpsom assistent som ekstraherer priser og deres kontekster fra norsk tekst om byggekostnader. Returner et JSON-objekt med 'prisliste' som en array av objekter, hver med 'pris' og 'kontekst' felt. Kontekst skal forklare hva prisen gjelder (f.eks. 'male hus', 'sette opp lettvegg')."},
                        {"role": "user", "content": f"Ekstraher alle priser fra følgende tekst og gi kort kontekst for hver pris. Tekst: {text_limited}"}
                    ],
                    response_format={"type": "json_object"}
                )
                ai_result = json.loads(response.choices[0].message.content)
                prices_with_context = ai_result.get("prisliste", [])
                break  # Success, exit retry loop
            except RateLimitError as e:
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 60  # Exponential backoff: 1min, 2min, 4min
                    print(f"Rate limit exceeded, waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                else:
                    print(f"Rate limit exceeded after {max_retries} attempts, falling back to regex")
                    break
            except Exception as e:
                print(f"AI extraction failed: {e}")
                break
    else:
        print("No OpenAI API key, using regex fallback")
        price_pattern = r'\b\d+(?:\.\d+)?\s*(?:kr|kroner|KR|KRONER)\b'
        for match in re.finditer(price_pattern, text_limited, re.IGNORECASE):
            start = max(0, match.start() - 100)
            end = min(len(text_limited), match.end() + 100)
            context = text_limited[start:end].strip()
            prices_with_context.append({
                'pris': match.group(),
                'kontekst': context
            })
    
    return prices_with_context

def main():
    # Load existing data if file exists
    data_file = 'price_data.json'
    if os.path.exists(data_file):
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"Loaded existing data with {len(data)} categories")
    else:
        data = {}
        print("Starting fresh scrape")
    
    categories = extract_categories()
    print(f"Found {len(categories)} categories")
    for slug, cat_info in categories.items():
        if cat_info['name'] in data:
            print(f"Skipping category: {cat_info['name']} (already exists)")
            continue
        print(f"Processing category: {cat_info['name']}")
        try:
            price_guides = extract_price_guides(cat_info['url'])
            data[cat_info['name']] = []
            for pg_slug, pg_info in price_guides.items():
                print(f"  Processing price guide: {pg_info['title']}")
                try:
                    prices = extract_price_data(pg_info['url'])
                    data[cat_info['name']].extend(prices)
                    # Write after each price guide
                    with open(data_file, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=4)
                    print(f"    Added {len(prices)} prices for {pg_info['title']}")
                except Exception as e:
                    print(f"    Error processing {pg_info['title']}: {e}")
                time.sleep(1)  # Be nice to the server
        except Exception as e:
            print(f"Error processing category {cat_info['name']}: {e}")
        time.sleep(1)
    
    print("Scraping completed. Final data saved to price_data.json")

if __name__ == "__main__":
    main()