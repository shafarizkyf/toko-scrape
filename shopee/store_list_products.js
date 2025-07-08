class Normalize {
  static price(valueStr) {
    return Number(valueStr.replace(/\./g, ''));
  }

  static discountPercentage(valueStr) {
    return Math.abs(Number(valueStr.replace('%', '')))
  }

  static soldCounter(valueStr) {
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
}

const storeName = location.pathname.replace('/', '');

const products = [];
document.querySelectorAll('.shop-search-result-view > .row > div').forEach(el => {
  const productLink = el.querySelector('a.contents').getAttribute('href');
  const productImageUrl = el.querySelector('img').getAttribute('src');
  const productImageAlt = el.querySelector('img').getAttribute('alt');

  const cardInfoEl = el.querySelector('a.contents > div > div:nth-child(2) div');
  const title = cardInfoEl.querySelector('div:nth-child(1)').textContent;
  const price = cardInfoEl.querySelector('div:nth-child(2) div.items-baseline > span:nth-child(2)').textContent;
  let discountPercentage = cardInfoEl.querySelector('div:nth-child(2) > div:nth-child(2) > span')?.getAttribute('aria-label') || null;

  const ratingEl = el.querySelector('img[alt="rating-star-full"]')?.parentElement;
  const ratingAvg = ratingEl ? ratingEl.querySelector('div').textContent : 0;

  // look for "x terjual"
  let soldCount = 0;
  const elements = el.querySelectorAll('div > div.text-shopee-black87');
  const soldEl = Array.from(elements).find(el =>
    el.textContent.trim().match(/terjual$/i)
  );

  if (soldEl) {
    soldCount = Normalize.soldCounter(soldEl.textContent);
  }

  const displayPrice = Normalize.price(price);
  discountPercentage = discountPercentage ? Normalize.discountPercentage(discountPercentage) : null;

  let normalPrice = displayPrice;
  if (discountPercentage) {
    normalPrice = displayPrice / (1 - discountPercentage / 100);
  }

  const product = {
    url: productLink,
    imageUrl: productImageUrl,
    name: title,
    normalPrice,
    discountPrice: discountPercentage ? displayPrice : null,
    discountPercentage,
    ratingAvg: Number(ratingAvg),
    soldCount,
  };

  products.push(product);
});

const data = {
  origin: location.href,
  storeName: storeName,
  data: products
}

console.log({ products });

const jsonStr = JSON.stringify(data, null, 2); // Pretty-printed
const blob = new Blob([jsonStr], { type: "application/json" });
const myurl = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = myurl;
link.download = `${storeName}_products.json`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url); // Clean up