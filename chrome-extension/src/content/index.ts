
class Normalize {
    static price(valueStr: string): number {
        return Number(valueStr.replace(/\./g, ''));
    }

    static discountPercentage(valueStr: string): number {
        return Math.abs(Number(valueStr.replace('%', '')))
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

// Download function
function downloadData(data: ScrapeResult) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.store.name}_products.json`;
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
    }
    return true;
});
