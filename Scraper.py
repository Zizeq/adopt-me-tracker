import requests
import json
import re

def parse_value(text, key, default_val):
    match = re.search(rf'"{key}":([\d.]+)', text)
    return float(match.group(1)) if match else default_val

def build_master_database():
    print("1. Sneaking past Cloudflare Security...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
    }
    
    response = requests.get("https://elvebredd.com/adopt-me-calculator", headers=headers)
    
    clean_text = response.text.replace('\\"', '"').replace('\\u0026', '&').replace('\\u0027', "'")
    
    pattern = r'\{[^{}]*"name":"[^"]+"[^{}]*"id":\d+[^{}]*\}'
    raw_items = re.findall(pattern, clean_text)
    
    if not raw_items:
        print("Error: Could not extract items. Cloudflare might be blocking the request.")
        return

    print(f"2. Found {len(raw_items)} items. Extracting Potion Matrix...")
    master_db = []
    seen_ids = set() # Prevents duplicate items
    
    for raw_item in raw_items:
        name_match = re.search(r'"name":"([^"]+)"', raw_item)
        id_match = re.search(r'"id":(\d+)', raw_item)
        image_match = re.search(r'"image":"([^"]+)"', raw_item)
        rarity_match = re.search(r'"rarity":"([^"]+)"', raw_item)
        is_pet = '"type":"pets"' in raw_item
        
        if not name_match or not id_match: continue
        
        item_id = int(id_match.group(1))
        if item_id in seen_ids:
            continue
        seen_ids.add(item_id)
            
        r_base = parse_value(raw_item, 'rvalue', parse_value(raw_item, 'value', 0.0))
        n_base = parse_value(raw_item, 'nvalue', 0.0)
        m_base = parse_value(raw_item, 'mvalue', 0.0)
        
        values_matrix = {
            "Reg": {
                "NoPot": parse_value(raw_item, 'rvalue - nopotion', r_base),
                "R": parse_value(raw_item, 'rvalue - ride', r_base),
                "F": parse_value(raw_item, 'rvalue - fly', r_base),
                "FR": parse_value(raw_item, 'rvalue - fly&ride', r_base)
            },
            "N": {
                "NoPot": parse_value(raw_item, 'nvalue - nopotion', n_base),
                "R": parse_value(raw_item, 'nvalue - ride', n_base),
                "F": parse_value(raw_item, 'nvalue - fly', n_base),
                "FR": parse_value(raw_item, 'nvalue - fly&ride', n_base)
            },
            "M": {
                "NoPot": parse_value(raw_item, 'mvalue - nopotion', m_base),
                "R": parse_value(raw_item, 'mvalue - ride', m_base),
                "F": parse_value(raw_item, 'mvalue - fly', m_base),
                "FR": parse_value(raw_item, 'mvalue - fly&ride', m_base)
            }
        }
        
        image_url = f"https://elvebredd.com{image_match.group(1)}".replace(" ", "%20") if image_match else ""
        
        master_db.append({
            "id": item_id,
            "name": name_match.group(1),
            "rarity": rarity_match.group(1) if rarity_match else "Normal",
            "is_pet": is_pet,
            "values": values_matrix,
            "image": image_url
        })

    print("3. Saving to master_database.ts...")
    
    ts_content = """// @ts-nocheck
export interface PotionValues {
  NoPot: number;
  R: number;
  F: number;
  FR: number;
}

export interface PetItem {
  id: number;
  name: string;
  rarity: string;
  is_pet: boolean;
  image: string;
  values: {
    Reg: PotionValues;
    N: PotionValues;
    M: PotionValues;
  };
}

export const petDatabase: PetItem[] = """

    with open('master_database.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)
        json.dump(master_db, f, indent=2)
        f.write(";\n")
        
    print("Done! Move this file into your 'lib' folder.")

if __name__ == "__main__":
    build_master_database()