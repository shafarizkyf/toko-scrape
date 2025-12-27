
class Normalize {
    static price(valueStr: string): number {
        return Number(valueStr.replace('Rp', '').replace(/\./g, ''));
    }

    static discountPercentage(valueStr: string): number {
        return Math.abs(Number(valueStr.replace('%', '')))
    }

    static reviewCount(valueStr: string): number {
        if (valueStr.includes('RB')) {
            const value = Number(valueStr.replace('RB', '').replace(',', '.'))
            return value * 1000;
        }
        return Number(valueStr);
    }

    static soldCount(valueStr: string): number {
        if (valueStr.includes('RB')) {
            const value = Number(valueStr.replace('RB', '').replace('+', ''))
            return value * 1000;
        }
        return Number(valueStr);
    }

    static soldCounter(valueStr: string): number {
        const numberWithUnit = valueStr
            .replace('terjual', '')
            .replace('+', '')
            .trim();

        if (numberWithUnit.includes('RB')) {
            const amountStr = numberWithUnit.replace('RB', '');
            return Number(amountStr) * 1000;
        }

        return Number(numberWithUnit);
    }

    static productUrl(path: string): string {
        return location.origin + path;
    }

    static variantionName(valueStr: string): string {
        return valueStr.replace(/^Pilih\s*/i, "").replace(/:\s*$/, "");
    }

    static tokopediaReviewCount(valueStr: string): number {
        const valueWithUnit = valueStr
            .replace('(', '')
            .replace(')', '')
            .replace(',', '.')
            .split(' ');

        let amount = Number(valueWithUnit[0]);
        const unit = valueWithUnit[1]

        if (unit && unit.toLocaleLowerCase() === 'rb') {
            amount *= 1000;
        }

        return amount;
    }

    static tokopediaSoldCount(valueStr: string): number {
        const clean = valueStr.replace('Terjual', '').replace('terjual', '').replace('+', '').trim();
        // Check if it has 'rb' (e.g. "1 rb")
        if (clean.toLowerCase().includes('rb')) {
            return parseFloat(clean.replace(/rb/i, '').replace(',', '.')) * 1000;
        }
        return Number(clean);
    }
}

function extractBaseImage(input: string): string | null {
    const match = input.match(/https:\/\/[^@,]+/);
    return match ? match[0] : null;
}

function removeClassAttributes(html: string): string {
    return html.replace(/\s*class="[^"]*"/g, '');
}

interface Product {
    url: string;
    imageUrl: string | null;
    name: string;
    normalPrice: number;
    discountPrice: number | null;
    discountPercentage: number | null;
    ratingAvg: number;
    soldCount: number;
}

interface ProductDetail {
    origin: string;
    name: string;
    categories: { name: string; url: string | null }[];
    images: (string | null)[];
    reviewAvg: number;
    reviewCount: number;
    soldCount: number;
    price: number;
    originalPrice: number;
    discountPercentage: number | null;
    description: string | null;
    shopName: string;
    variants: {
        name: string;
        options: {
            name: string | null;
            isAvailable?: boolean;
            isSelected?: boolean;
            status?: string; // Tokopedia specific
        }[];
    }[];
    stock?: number;
    info?: {
        condition?: string;
        minimum_order?: string;
        display?: { name: string; url: string | null };
    };
}

interface ScrapeResult {
    origin: string;
    domain: string;
    store: {
        name: string;
        imageUrl: string | null;
        meta: {
            title: string;
            description: string;
        }
    };
    data: Product[];
}

function scrapeData(): ScrapeResult | null {
    const shopEl = document.querySelector('.shop-page__info');
    if (!shopEl) {
        console.error('Shop element not found');
        return null;
    }

    const products: Product[] = [];
    document.querySelectorAll('.shop-search-result-view > .row > div').forEach(el => {
        const productLink = el.querySelector('a.contents')?.getAttribute('href');
        const productImageUrl = el.querySelector('img')?.getAttribute('src') || null;

        // Safety check if element structure is different
        if (!productLink) return;

        const cardInfoEl = el.querySelector('a.contents > div > div:nth-child(2) div');
        if (!cardInfoEl) return;

        const titleEl = cardInfoEl.querySelector('div:nth-child(1)');
        const title = titleEl?.textContent || '';

        const priceEl = cardInfoEl.querySelector('div:nth-child(2) div.items-baseline > span:nth-child(2)');
        const price = priceEl?.textContent || '0';

        let discountPercentage = cardInfoEl.querySelector('div:nth-child(2) > div:nth-child(2) > span')?.getAttribute('aria-label') || null;

        const ratingEl = el.querySelector('img[alt="rating-star-full"]')?.parentElement;
        const ratingAvg = ratingEl ? ratingEl.querySelector('div')?.textContent || '0' : '0';

        // look for "x terjual"
        let soldCount = 0;
        const elements = el.querySelectorAll('div > div.text-shopee-black87');
        const soldEl = Array.from(elements).find(el =>
            el.textContent?.trim().match(/terjual$/i)
        );

        if (soldEl && soldEl.textContent) {
            soldCount = Normalize.soldCounter(soldEl.textContent);
        }

        const displayPrice = Normalize.price(price);
        const discPercVal = discountPercentage ? Normalize.discountPercentage(discountPercentage) : null;

        let normalPrice = displayPrice;
        if (discPercVal) {
            normalPrice = displayPrice / (1 - discPercVal / 100);
        }

        const product: Product = {
            url: Normalize.productUrl(productLink),
            imageUrl: productImageUrl,
            name: title,
            normalPrice,
            discountPrice: discPercVal ? displayPrice : null,
            discountPercentage: discPercVal,
            ratingAvg: Number(ratingAvg),
            soldCount,
        };

        products.push(product);
    });

    const domain = location.pathname.replace('/', '');

    const storeNameEl = shopEl.querySelector('h1');
    const storeImgEl = shopEl.querySelector('img.shopee-avatar__img');
    const metaTitleEl = document.querySelector('meta[name="title"]');
    const metaDescEl = document.querySelector('meta[name="description"]');

    const data: ScrapeResult = {
        origin: location.href,
        domain,
        store: {
            name: storeNameEl?.textContent || '',
            imageUrl: storeImgEl?.getAttribute('src') || null,
            meta: {
                title: metaTitleEl?.getAttribute('content') || '',
                description: metaDescEl?.getAttribute('content') || '',
            }
        },
        data: products
    };

    return data;
}



function scrapeProductDetail(): ProductDetail | null {
    const containerEl = document.querySelector('div[role="main"].container');
    if (!containerEl) {
        console.error('Container element not found');
        return null;
    }

    const breadcrumb = containerEl.querySelector('.page-product__breadcrumb');
    const contentEl = containerEl.querySelector('section');
    if (!contentEl) return null;

    const mediaEl = contentEl.querySelector('section:nth-child(1) > div:nth-child(1)');
    const buySectionEl = contentEl.querySelector('section:nth-child(2) > div:nth-child(1)');
    const productDetailEl = containerEl.querySelector('.product-detail.page-product__detail');
    const shopEl = containerEl.querySelector('section.page-product__shop');

    if (!mediaEl || !buySectionEl || !productDetailEl || !shopEl) {
        console.error('One or more required elements not found');
        return null;
    }

    const categories: { name: string; url: string | null }[] = [];
    breadcrumb?.querySelectorAll('a').forEach(el => {
        categories.push({
            name: el.textContent || '',
            url: el.getAttribute('href')
        });
    });

    // image slider
    const images: (string | null)[] = [];
    mediaEl.querySelectorAll('div:nth-child(2) > div source').forEach(el => {
        const imageSet = el.getAttribute('srcset');
        if (imageSet) {
            const imageBaseUrl = extractBaseImage(imageSet);
            images.push(imageBaseUrl);
        }
    });

    // product detail section
    let productDescription: string | null = null;
    productDetailEl.querySelectorAll('section').forEach(el => {
        const sectionName = el.querySelector('h2')?.textContent;
        if (sectionName?.toLocaleLowerCase() === 'deskripsi produk') {
            const descContainer = productDetailEl.querySelector('section:nth-child(2) > div > div');
            productDescription = descContainer ? descContainer.innerHTML : null;
        }
    });

    // variant section
    const variantsEl = buySectionEl
        .querySelector('div.shopee-input-quantity')
        ?.closest('section')
        ?.parentElement; // variant section and quantity input has the same parent

    const variants: ProductDetail['variants'] = [];

    if (variantsEl) {
        const hasVariantSection = variantsEl.childElementCount > 1;

        if (hasVariantSection) {
            // -1, to not include quantity container
            for (let i = 0; i < variantsEl.childElementCount - 1; i++) {
                const variantEl = variantsEl.childNodes[i] as Element;
                const variantName = variantEl.querySelector('h2')?.textContent || '';

                // variant options
                const variantOptions: ProductDetail['variants'][0]['options'] = [];
                variantEl.querySelectorAll('button').forEach(optionEl => {
                    variantOptions.push({
                        name: optionEl.getAttribute('aria-label'),
                        isAvailable: optionEl.getAttribute('aria-disabled') === 'true',
                        isSelected: optionEl.className.includes('selection-box-selected'),
                    });
                });

                variants.push({
                    name: variantName,
                    options: variantOptions
                });
            }
        }
    }

    const priceSectionEl = buySectionEl.querySelector('section > div');
    const shopNameBtn = shopEl.querySelector('button'); // button "Chat Sekarang" or "Kunjungi Toko"
    const shopName = shopNameBtn?.parentElement?.parentElement?.firstChild?.textContent || '';

    let price = 0;
    let originalPrice = 0;

    if (priceSectionEl) {
        // consist of discount price, final price indicator, normal price
        if (priceSectionEl.childElementCount == 3) {
            price = Normalize.price(priceSectionEl.querySelector('div:nth-child(1)')?.textContent || '0');
            originalPrice = Normalize.price(priceSectionEl.querySelector('div:nth-child(3)')?.textContent || '0');

            // price range and discount percentage
        } else if (priceSectionEl.childElementCount == 2) {
            const discountPriceRangeStr = priceSectionEl.querySelector('div:nth-child(1)')?.textContent || '';
            const discountPriceRange = discountPriceRangeStr.split(' - ');
            // pick lowest price
            if (discountPriceRange[0]) price = Normalize.price(discountPriceRange[0]);

            const originalPriceRangeStr = priceSectionEl.parentElement?.childNodes[1]?.textContent || '';
            const originalPriceRange = originalPriceRangeStr.split(' - ');
            // pick lowest price
            if (originalPriceRange[1]) originalPrice = Normalize.price(originalPriceRange[1]);

            // no discount price
        } else if (priceSectionEl.childElementCount == 1) {
            price = originalPrice = Normalize.price(priceSectionEl.querySelector('div')?.textContent || '0');
        }
    }

    const product: ProductDetail = {
        origin: location.href,
        name: buySectionEl.querySelector('div:nth-child(1) > h1')?.textContent || '',
        categories,
        images,
        reviewAvg: Number(buySectionEl.querySelector('div:nth-child(2) > button:nth-child(1) > div')?.textContent || 0),
        reviewCount: Normalize.reviewCount(buySectionEl.querySelector('div:nth-child(2) > button:nth-child(2) > div:nth-child(1)')?.textContent || '0'),
        soldCount: Normalize.soldCount(buySectionEl.querySelector('div:nth-child(2) > div span')?.textContent || '0'),
        price,
        originalPrice,
        discountPercentage: null,
        description: productDescription ? removeClassAttributes(productDescription) : null,
        shopName,
        variants,
    };

    return product;
}

// Download function
function downloadData(data: ScrapeResult | ProductDetail) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    if ('store' in data) {
        link.download = `${data.store.name}_products.json`;
    } else {
        link.download = `${data.name}.json`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function scrapeTokopediaList(): ScrapeResult | null {
    // Selectors from tokopedia/store_list_products.js
    const productCardsEl = document.querySelectorAll('.css-tjjb18 > .css-79elbk');
    if (!productCardsEl.length) {
        console.error('Tokopedia product cards not found');
        return null;
    }

    const products: Product[] = [];
    productCardsEl.forEach((el) => {
        const productLink = el.querySelector('a')?.getAttribute('href') || '';
        const productImageUrl = el.querySelector('img')?.getAttribute('src') || null;

        const productImageEl = el.querySelector('a > div > div:nth-child(1)');
        const productInfoEl = el.querySelector('a > div > div:nth-child(2)');

        if (!productInfoEl) return;

        const productName = productInfoEl.querySelector('div > span')?.textContent || '';

        const productPriceEl = productInfoEl.querySelector('div:nth-child(2)');
        const discountPrice = productPriceEl?.querySelector('div:nth-child(1) > span')?.textContent || '0';
        const normalPrice = productPriceEl?.querySelector('div:nth-child(2) > span')?.textContent || discountPrice;

        let discountPercentageStr = '';
        if (productImageEl) {
            discountPercentageStr = productImageEl.querySelector('div > div:nth-child(2) > span:nth-child(1)')?.textContent?.replace('>', '') || '';
        }

        const ratingParentEl = el.querySelector('img[alt="rating"]')?.parentElement?.parentElement;
        const ratingAvg = ratingParentEl ? Number(ratingParentEl.querySelector('span')?.textContent || 0) : 0;

        let soldCount = 0;
        const elements = el.querySelectorAll('div > span');
        const soldEl = Array.from(elements).find(el =>
            el.textContent?.trim().match(/^\d+\s*terjual$/i)
        );

        if (soldEl && soldEl.textContent) {
            soldCount = Normalize.tokopediaSoldCount(soldEl.textContent);
        }

        const productCardData: Product = {
            url: productLink,
            imageUrl: productImageUrl,
            name: productName,
            discountPrice: Normalize.price(discountPrice),
            normalPrice: Normalize.price(normalPrice),
            discountPercentage: discountPercentageStr ? Normalize.discountPercentage(discountPercentageStr) : null,
            ratingAvg,
            soldCount,
        };

        products.push(productCardData);
    });

    const shopName = document.querySelector('[data-testid="shopNameHeader"]')?.textContent || '';
    const shopImg = document.querySelector('[data-testid="shopProfilePictureHeader"] img')?.getAttribute('src') || null;
    const metaTitle = document.querySelector('meta[name="title"]')?.getAttribute('content') || '';
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    const data: ScrapeResult = {
        origin: location.href,
        domain: 'tokopedia',
        store: {
            name: shopName,
            imageUrl: shopImg,
            meta: {
                title: metaTitle,
                description: metaDesc,
            }
        },
        data: products
    };

    return data;
}

function scrapeTokopediaDetail(): ProductDetail | null {
    // Selectors from tokopedia/product_detail.js
    const nameEl = document.querySelector('h1[data-testid="lblPDPDetailProductName"]');
    if (!nameEl) {
        console.error('Tokopedia product detail failed: Name not found');
        return null;
    }

    // Breadcrumb
    const categories: { name: string; url: string | null }[] = [];
    document.querySelectorAll('[data-testid="lnkPDPDetailBreadcrumb"] li').forEach(el => {
        categories.push({
            name: el.getAttribute('text') || '',
            url: el.getAttribute('url')
        });
    });

    // Images
    const images: (string | null)[] = [];
    document.querySelectorAll('[data-testid="PDPImageThumbnail"] img').forEach(el => {
        const imageSmallUrl = el.getAttribute('src');
        if (imageSmallUrl) {
            const imageLargeUrl = imageSmallUrl.replace('200', '500-square');
            images.push(imageLargeUrl);
        }
    });

    // Variants
    const variants: ProductDetail['variants'] = [];
    document.querySelectorAll('[data-testid="pdpVariantContainer"] > div > div').forEach(el => {
        const variantionNameEl = el.querySelector('p > b');
        if (!variantionNameEl) return;

        const variantionName = variantionNameEl.textContent || '';
        const options: ProductDetail['variants'][0]['options'] = [];

        el.querySelectorAll('button').forEach(optionEl => {
            const statusUnformatted = optionEl.parentElement?.getAttribute('data-testid')?.toLocaleLowerCase() || '';

            let status = 'unknown';
            if (statusUnformatted.includes('selected')) {
                status = 'selected'
            } else if (statusUnformatted.includes('inactive')) {
                status = 'inactive'
            } else if (statusUnformatted.includes('active')) {
                status = 'active';
            }

            options.push({
                name: optionEl.textContent,
                status // Tokopedia specific status
            });
        });

        variants.push({
            name: Normalize.variantionName(variantionName),
            options
        });
    });

    // Info
    const info: ProductDetail['info'] = {};
    document.querySelectorAll('[data-testid="lblPDPInfoProduk"] li').forEach(el => {
        const property = el.querySelector('span:nth-child(1)')?.textContent?.toLocaleLowerCase() || '';
        if (property.includes('kondisi')) {
            info.condition = el.querySelector('span.main')?.textContent || undefined;
        } else if (property.includes('min. pemesanan')) {
            info.minimum_order = el.querySelector('span.main')?.textContent || undefined;
        } else if (property.includes('etalase')) {
            info.display = {
                name: el.querySelector('a > b')?.textContent || '',
                url: el.querySelector('a')?.getAttribute('href') || null
            };
        }
    });

    const price = document.querySelector('[data-testid="lblPDPDetailProductPrice"]')?.textContent || '0';
    const originalPrice = document.querySelector('[data-testid="lblPDPDetailOriginalPrice"]')?.textContent || price;
    const discountPercentage = document.querySelector('[data-testid="lblPDPDetailDiscountPercentage"]')?.textContent || '';

    // Rating
    const ratingEl = document.querySelector('[id="pdp_comp-shop_credibility"] > div:nth-child(2) p');
    const reviewAvg = ratingEl ? Number(ratingEl.querySelector('span:nth-child(1)')?.textContent || 0) : 0;
    const reviewCountStr = ratingEl ? ratingEl.querySelector('span:nth-child(2)')?.textContent || '0' : '0';

    const soldCountStr = document.querySelector('[data-testid="lblPDPDetailProductSoldCounter"]')?.textContent || '0';
    const shopName = document.querySelector('[data-testid="llbPDPFooterShopName"] h2')?.textContent || '';
    const description = document.querySelector('[data-testid="lblPDPDescriptionProduk"]')?.textContent || null;
    const stock = Number(document.querySelector('[data-testid="stock-label"] b')?.textContent || 0);

    const product: ProductDetail = {
        origin: location.href,
        name: nameEl.textContent || '',
        description,
        price: Normalize.price(price),
        originalPrice: Normalize.price(originalPrice),
        discountPercentage: discountPercentage ? Normalize.discountPercentage(discountPercentage) : null,
        stock,
        categories,
        images,
        variants,
        info,
        shopName,
        reviewAvg,
        reviewCount: Normalize.tokopediaReviewCount(reviewCountStr),
        soldCount: Normalize.tokopediaSoldCount(soldCountStr),
    };

    return product;
}

// Listen for messages
chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log("Message received:", request.action);

    if (request.action === "SCRAPE" || request.action === "SCRAPE_SHOPEE") {
        console.log("Scraping Shopee List...");
        try {
            const data = scrapeData();
            if (data) {
                console.log("Scraped data:", data);
                downloadData(data); // Auto download in content script context
                sendResponse({ status: "success", count: data.data.length });
            } else {
                sendResponse({ status: "error", message: "Failed to scrape or no data found" });
            }
        } catch (e: any) {
            console.error(e);
            sendResponse({ status: "error", message: e.message });
        }
    } else if (request.action === "SCRAPE_DETAIL" || request.action === "SCRAPE_SHOPEE_DETAIL") {
        console.log("Scraping Shopee Detail...");
        try {
            const data = scrapeProductDetail();
            if (data) {
                console.log("Scraped data:", data);
                downloadData(data);
                sendResponse({ status: "success", count: 1 });
            } else {
                sendResponse({ status: "error", message: "Failed to scrape details" });
            }
        } catch (e: any) {
            console.error(e);
            sendResponse({ status: "error", message: e.message });
        }
    } else if (request.action === "SCRAPE_TOKOPEDIA") {
        console.log("Scraping Tokopedia List...");
        try {
            const data = scrapeTokopediaList();
            if (data) {
                console.log("Scraped data:", data);
                downloadData(data);
                sendResponse({ status: "success", count: data.data.length });
            } else {
                sendResponse({ status: "error", message: "Failed to scrape Tokopedia list. Make sure you are on a store page." });
            }
        } catch (e: any) {
            console.error(e);
            sendResponse({ status: "error", message: e.message });
        }
    } else if (request.action === "SCRAPE_TOKOPEDIA_DETAIL") {
        console.log("Scraping Tokopedia Detail...");
        try {
            const data = scrapeTokopediaDetail();
            if (data) {
                console.log("Scraped data:", data);
                downloadData(data);
                sendResponse({ status: "success", count: 1 });
            } else {
                sendResponse({ status: "error", message: "Failed to scrape Tokopedia detail. Make sure you are on a product page." });
            }
        } catch (e: any) {
            console.error(e);
            sendResponse({ status: "error", message: e.message });
        }
    }

    return true;
});
