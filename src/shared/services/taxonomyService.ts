import type { ApparelMainCategory, ApparelItemDefinition, TaxonomyEntry } from '../types/types';

// Data structure returned by the service
export interface TaxonomyData {
    masterTaxonomy: TaxonomyEntry[];
    apparelStructure: ApparelMainCategory[];
    loadErrors: string[];
}

// --- Constants for loading ---
const PAVORA_CATEGORY_FILES = [
  "accessories.json", "bags.json", "bottoms.json", "costumes.json", "cultural_wear.json",
  "dresses.json", "footwear.json", "intimates.json", "outerwear.json", "swimwear.json",
  "tops.json", "functional_wear.json", "headwear.json", "jewelry.json", "jumpsuits.json",
  "sets.json", "traditional.json", "wedding.json", "special_costume.json", "cosplay.json",
  "lingerie.json"
];

// Use Vite's import.meta.glob to bundle JSON files
// This ensures data is available in production builds without network requests
const JSON_MODULES = import.meta.glob('../../../data/*.json', { eager: true });

const MAIN_CATEGORY_ORDER = [
  "tops", "bottoms", "dresses", "jumpsuits", "sets", "intimates", "swimwear", "outerwear",
  "footwear", "bags", "accessories", "headwear", "jewelry", "functional_wear", "costumes",
  "cosplay", "cultural_wear", "wedding", "traditional", "special_costume"
];

const MAIN_CATEGORY_TRANSLATIONS: { [key: string]: string } = {
  tops: "上身",
  bottoms: "下身",
  dresses: "洋裝",
  jumpsuits: "連身褲",
  sets: "套裝",
  intimates: "貼身衣物",
  swimwear: "泳裝",
  outerwear: "外套",
  footwear: "鞋類",
  bags: "包袋",
  accessories: "配件",
  headwear: "頭飾",
  jewelry: "珠寶",
  functional_wear: "機能服飾",
  costumes: "造型服飾",
  cosplay: "角色扮演",
  cultural_wear: "文化服飾",
  wedding: "婚紗禮服",
  traditional: "傳統服飾",
  special_costume: "特殊服飾",
};


// --- Helper Functions ---

function expandTaxonomyEntries(entries: TaxonomyEntry[]): TaxonomyEntry[] {
    const expandedEntries: TaxonomyEntry[] = [];
    for (const entry of entries) {
        if (entry.variants && entry.variants.length > 0) {
            entry.variants.forEach((variantName, index) => {
                const newEntry: TaxonomyEntry = {
                    ...entry,
                    id: `${entry.id}-v${index}`, // Unique ID for the variant
                    display_name_zh: variantName,
                    display_name_en: entry.variants_en?.[index] || variantName,
                    prompt_base: [entry.prompt_base, entry.prompt_variant?.[index]].filter(Boolean).join(', '),
                    // Remove variant fields as this is now a final-level item
                    variants: undefined,
                    variants_en: undefined,
                    prompt_variant: undefined,
                };
                expandedEntries.push(newEntry);
            });
        } else {
            expandedEntries.push(entry);
        }
    }
    return expandedEntries;
}

async function $loadEntriesFromPavora(): Promise<{ entries: TaxonomyEntry[], errors: string[] }> {
  const out: TaxonomyEntry[] = [];
  const errors: string[] = [];
  
  for (const fname of PAVORA_CATEGORY_FILES) {
    try {
      // The key in JSON_MODULES is the relative path from this file to the JSON file
      const moduleKey = `../../../data/${fname}`;
      const j: any = JSON_MODULES[moduleKey];
      
      if (!j) {
        throw new Error(`Module not found for ${fname}`);
      }

      const items = Array.isArray(j?.items) ? j.items : [];
      for (const it of items) {
        if (it.variants && it.prompt_variant) {
            if (it.variants.length !== it.prompt_variant.length) {
                const errorMsg = `[Pavora] variant length mismatch in ${fname}: ${it.id}`;
                console.warn(errorMsg);
                errors.push(errorMsg);
            }
        }
        if (it.id) {
          out.push(it as TaxonomyEntry);
        }
      }
    } catch (e) {
      const errorMsg = `[Pavora] skip file: ${fname}, ${String((e as any)?.message || e)}`;
      console.warn(errorMsg);
      errors.push(errorMsg);
    }
  }
  return { entries: out, errors };
}

const generateApparelStructure = (masterTaxonomy: TaxonomyEntry[]): ApparelMainCategory[] => {
    const mainCategories: { [key: string]: { [key: string]: ApparelItemDefinition[] } } = {};

    masterTaxonomy.forEach(item => {
        if(!item.category || !item.group) return; // Skip items without category or group
        const mainCatKey = item.category;
        const groupName = item.group;

        if (!mainCategories[mainCatKey]) {
            mainCategories[mainCatKey] = {};
        }
        if (!mainCategories[mainCatKey][groupName]) {
            mainCategories[mainCatKey][groupName] = [];
        }
        
        mainCategories[mainCatKey][groupName].push({ id: item.id, name: item.display_name_zh });
    });

    const intermediateResult = Object.entries(mainCategories).map(([mainCategoryKey, groups]) => {
        const mainCategoryName = MAIN_CATEGORY_TRANSLATIONS[mainCategoryKey] || (mainCategoryKey.charAt(0).toUpperCase() + mainCategoryKey.slice(1).replace(/_/g, ' '));
        
        return {
            mainCategoryKey: mainCategoryKey,
            mainCategory: mainCategoryName,
            groups: Object.entries(groups)
                .map(([groupName, items]) => ({ groupName, items: items.sort((a,b) => a.name.localeCompare(b.name, 'zh-Hant')) }))
                .sort((a,b) => a.groupName.localeCompare(b.groupName, 'zh-Hant')),
        };
    });
    
    intermediateResult.sort((a, b) => {
        const indexA = MAIN_CATEGORY_ORDER.indexOf(a.mainCategoryKey);
        const indexB = MAIN_CATEGORY_ORDER.indexOf(b.mainCategoryKey);
        if (indexA === -1 && indexB === -1) return a.mainCategory.localeCompare(b.mainCategory, 'zh-Hant');
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return intermediateResult.map(({ mainCategory, groups }) => ({
        mainCategory,
        groups
    }));
};

export const isApparelInCategory = (
  apparelId: string,
  categoryId: string,
  masterTaxonomy: TaxonomyEntry[]
): boolean => {
    const item = masterTaxonomy.find(t => t.id === apparelId);
    return item ? item.category.includes(categoryId) || item.id.includes(categoryId) : false;
};


// --- Main Service Function ---

export async function loadTaxonomyData(): Promise<TaxonomyData> {
  const result: TaxonomyData = {
    masterTaxonomy: [],
    apparelStructure: [],
    loadErrors: []
  };
  
  try {
    const { entries: dyn, errors: loadErrors } = await $loadEntriesFromPavora();
    result.loadErrors.push(...loadErrors);

    if (dyn.length > 0) {
      result.masterTaxonomy = expandTaxonomyEntries(dyn);
    } else {
      console.warn("[Pavora] no entries from category files were loaded.");
      result.loadErrors.push("Warning: No entries loaded from category files. Data will be empty.");
    }
    
    result.apparelStructure = generateApparelStructure(result.masterTaxonomy);
    
    console.log("[Pavora] taxonomy loaded; entries:", result.masterTaxonomy.length);

  } catch (e) {
    const errorMsg = `[Pavora] load failed. ${e}`;
    console.error(errorMsg, e);
    result.loadErrors.push(errorMsg);
  }

  return result;
}
