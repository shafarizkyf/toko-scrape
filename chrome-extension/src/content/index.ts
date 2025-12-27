
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
            isAvailable: boolean;
            isSelected: boolean;
        }[];
    }[];
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

// Listen for messages
chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (request.action === "SCRAPE") {
        console.log("Scraping started...");
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
    } else if (request.action === "SCRAPE_DETAIL") {
        console.log("Scraping detail started...");
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
    }
    return true;
});
