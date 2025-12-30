const urlPaths = location.pathname.split('/');
const domain = urlPaths[1];
const products = [];

class Normalize {
  static price(valueStr) {
    return Number(valueStr.replace('Rp', '').replace(/\./g, ''));
  }

  static discountPercentage(valueStr) {
    return Number(valueStr.replace('%', ''))
  }

  static soldCounter(valueStr) {
    const cleanStr = valueStr
      ?.replace('+', '')
      ?.replace('terjual', '')
      .trim();

    if (cleanStr.toLowerCase().includes('rb')) {
      return Number(cleanStr.replace('rb', '')) * 1000;
    }

    return Number(cleanStr)
  }
}

document.querySelectorAll('div[data-testid="divSRPContentProducts"] > div > div').forEach((el, index) => {
  const card = el.querySelector('div > a');
  if (card) {
    const cardImageContainer = card.querySelector(':scope > div > div:first-child');
    const cardBody = card.querySelector(':scope > div > div:last-child');

    let discountPrice = '';
    let normalPrice = '';
    let discountPercentage = cardImageContainer.querySelector(':scope > div > div:nth-child(2) > span')?.textContent || '';
    let soldCount = '';
    let ratingAvg = '';
    let storeName = cardBody.querySelector('div:nth-child(5)').querySelector('div:nth-child(2) > span')?.textContent || '';

    const priceEl = cardBody.querySelector('div:nth-child(2)');

    if (priceEl?.childElementCount === 1) {
      normalPrice = priceEl.querySelector('div').textContent;
    } else if (priceEl?.childElementCount === 2) {
      const prices = priceEl.querySelectorAll('div');
      discountPrice = prices[0].textContent;
      normalPrice = prices[1].querySelector('span').textContent;
    } else {
      console.log(cardBody);
    }

    if (storeName) {
      const ratingAndSoldEl = cardBody.querySelector('div:nth-child(4)');
      ratingAvg = ratingAndSoldEl.querySelector(':scope > div > span:last-child')?.textContent || '';
      soldCount = ratingAndSoldEl.querySelector(':scope > span:last-child')?.textContent || ''
    }

    if (!storeName) {
      // because does not have sold counter
      storeName = cardBody.querySelector('div:nth-child(4)').querySelector('div:nth-child(2) > span')?.textContent || '';
    }

    if (!storeName) {
      // does not have purple checkmark icon beside the name
      storeName = cardBody.querySelector('div:nth-child(5)').querySelector('div > span')?.textContent || '';
    }

    const productCardData = {
      url: card.getAttribute('href'),
      imageUrl: cardImageContainer.querySelector('img').getAttribute('src'),
      name: cardBody.querySelector('div:nth-child(1) > span').textContent,
      discountPrice: Normalize.price(discountPrice),
      normalPrice: Normalize.price(normalPrice),
      discountPercentage: Normalize.discountPercentage(discountPercentage),
      ratingAvg: Number(ratingAvg || 0),
      soldCount: Normalize.soldCounter(soldCount),
      storeName
    }

    products.push(productCardData);
  }
});

const data = {
  origin: location.href,
  domain: domain,
  data: products
}

const jsonStr = JSON.stringify(data, null, 2); // Pretty-printed
const blob = new Blob([jsonStr], { type: "application/json" });
const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
link.download = `search_result.json`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url); // Clean up