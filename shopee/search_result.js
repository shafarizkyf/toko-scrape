class Normalize {
  static price(valueStr) {
    return Number(valueStr.replace(/\./g, ''));
  }

  static discountPercentage(valueStr) {
    return Math.abs(Number(valueStr.replace('%', '')))
  }

  static soldCounter(valueStr) {
    const numberWithUnit = valueStr
      .toLowerCase()
      .replace('terjual', '')
      .replace('+', '')
      .trim();

    if (numberWithUnit.toUpperCase().includes('RB')) {
      const amountStr = numberWithUnit.replace('RB', '');
      return Number(amountStr) * 1000;
    }

    return Number(numberWithUnit);
  }

  static productUrl(path) {
    return location.origin + path;
  }
}

const products = [];
document.querySelectorAll('ul.row.shopee-search-item-result__items > li').forEach((li, index) => {
  const card = li.querySelector('a > div');
  const imageContainer = card.querySelector(':scope > div:first-child');
  const bodyContainer = card.querySelector(':scope > div:last-child');
  const ratingAndSoldContainer = bodyContainer.querySelector(':scope > div:nth-child(2) > div:last-child');

  let discountPrice = '';
  let normalPrice = bodyContainer.querySelector('span.truncate').textContent;
  let discountPercentage = '';
  let soldCount = ratingAndSoldContainer?.querySelector('div.truncate')?.textContent || '';
  let ratingAvg = ratingAndSoldContainer?.querySelector('div.text-shopee-black87.flex-none')?.textContent || '';

  const productCardData = {
    url: li.querySelector('a').getAttribute('href'),
    imageUrl: imageContainer.querySelector('img').getAttribute('src'),
    name: bodyContainer.querySelector('div.break-words').textContent,
    discountPrice: Normalize.price(discountPrice),
    normalPrice: Normalize.price(normalPrice),
    discountPercentage: Normalize.discountPercentage(discountPercentage),
    ratingAvg: Number(ratingAvg || 0),
    soldCount: Normalize.soldCounter(soldCount),
    storeName: '',
  }

  products.push(productCardData);
});

const domain = location.pathname.replace('/', '');

const data = {
  origin: location.href,
  domain: domain,
  data: products
}

const jsonStr = JSON.stringify(data, null, 2); // Pretty-printed
const blob = new Blob([jsonStr], { type: "application/json" });
const myurl = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = myurl;
link.download = `search_result_products.json`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url); // Clean up