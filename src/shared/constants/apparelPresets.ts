
// --- Apparel Design Presets ---

export const PAVORA_DESIGN_BRANDS = [
    // Luxury
    { 
        id: 'chanel', 
        name: 'Chanel', 
        display_name: 'Chanel',
        stylePrompt: 'signature tweed fabric, boxy silhouette, pearl accents, interlocking patterns, monochromatic black and white, quilted leather textures, timeless elegance' 
    },
    { 
        id: 'gucci', 
        name: 'Gucci', 
        display_name: 'Gucci',
        stylePrompt: 'eccentric maximalism, double G monogram, horsebit details, green and red web stripe, bold floral and animal prints, retro 70s glamour'
    },
    { 
        id: 'dior', 
        name: 'Dior', 
        display_name: 'Dior',
        stylePrompt: 'refined feminine silhouette, bar jacket structure, toile de jouy pattern, elegant haute couture details, soft grey and navy tones, ladylike grace'
    },
    { 
        id: 'louis_vuitton', 
        name: 'Louis Vuitton', 
        display_name: 'Louis Vuitton',
        stylePrompt: 'classic LV monogram canvas, checkerboard damier pattern, luxury travel aesthetic, rich leather trim, gold hardware, modern chic'
    },
    { 
        id: 'prada', 
        name: 'Prada', 
        display_name: 'Prada',
        stylePrompt: 'minimalist nylon, triangular logo plaque, saffiano leather texture, clean geometric lines, industrial chic, intellectual fashion'
    },
    { 
        id: 'versace', 
        name: 'Versace', 
        display_name: 'Versace',
        stylePrompt: 'bold baroque prints, medusa head motif, gold chain details, vibrant colors, sensual cutouts, italian glamour, high impact'
    },
    { 
        id: 'hermes', 
        name: 'Hermes', 
        display_name: 'Hermès',
        stylePrompt: 'finest saddle leather, equestrian heritage, H logo, intricate silk scarf patterns, orange and brown palette, quiet luxury, craftsmanship'
    },
    { 
        id: 'balenciaga', 
        name: 'Balenciaga', 
        display_name: 'Balenciaga',
        stylePrompt: 'oversized silhouette, exaggerated shoulders, streetwear influence, deconstructed aesthetics, technical fabrics, avant-garde shapes'
    },
    // Sport / Street
    { 
        id: 'nike', 
        name: 'Nike', 
        display_name: 'Nike',
        stylePrompt: 'performance athletic wear, iconic swoosh branding, technical dri-fit fabric textures, dynamic sporty lines, neon accents, active lifestyle'
    },
    { 
        id: 'adidas', 
        name: 'Adidas', 
        display_name: 'Adidas',
        stylePrompt: 'classic three stripes motif, trefoil logo, retro sportswear aesthetic, track jacket styling, comfortable performance knit'
    },
    { 
        id: 'supreme', 
        name: 'Supreme', 
        display_name: 'Supreme',
        stylePrompt: 'hypebeast streetwear, bold box logo, red and white, urban skate culture aesthetic, oversized fit, graphic prints'
    },
    { 
        id: 'off_white', 
        name: 'Off-White', 
        display_name: 'Off-White',
        stylePrompt: 'industrial belt, diagonal stripes, helvetica text in quotes, zip ties, deconstructed streetwear, modern urban edge'
    },
    // Minimal / Fast Fashion
    { 
        id: 'uniqlo', 
        name: 'Uniqlo', 
        display_name: 'Uniqlo',
        stylePrompt: 'lifewear philosophy, high quality basics, clean minimalist cut, functional fabrics, neutral palette, everyday comfort'
    },
    { 
        id: 'cos', 
        name: 'COS', 
        display_name: 'COS',
        stylePrompt: 'architectural silhouette, modern minimalism, solid blocks of color, crisp cotton and wool textures, timeless structure'
    },
    { 
        id: 'zara', 
        name: 'Zara', 
        display_name: 'Zara',
        stylePrompt: 'trendy fast fashion, contemporary runway inspired styles, diverse textures, urban chic, adaptable seasonal looks'
    }
];

export const BRAND_OPTIONS = [
    { id: 'none', name: '無 (None)' },
    { id: 'custom', name: '自訂品牌 (Custom)' },
    ...PAVORA_DESIGN_BRANDS.map(b => ({ id: b.id, name: b.display_name }))
];
