class Normalize {
  static price(valueStr) {
    return Number(valueStr.replace('Rp', '').replace(/\./g, ''));
  }

  static discountPercentage(valueStr) {
    return Number(valueStr.replace('%', ''))
  }

  static soldCounter(valueStr) {
    return Number(valueStr.replace('terjual', '').trim())
  }
}

const urlPaths = location.pathname.split('/');
const domain = urlPaths[1];

const products = [];
const productCardsEl = '.css-tjjb18 > .css-79elbk';
document.querySelectorAll(productCardsEl).forEach((el) => {
  const productLink = el.querySelector('a').getAttribute('href');
  const productImageUrl = el.querySelector('img').getAttribute('src');

  // image thumbnail with discount badge container
  const productImageEl = el.querySelector('a > div > div:nth-child(1)');
  // product information container (name, price)
  const productInfoEl = el.querySelector('a > div > div:nth-child(2)');

  const productName = productInfoEl.querySelector('div > span').textContent;

  const productPriceEl = productInfoEl.querySelector('div:nth-child(2)');
  const discountPrice = productPriceEl.querySelector('div:nth-child(1) > span').textContent;
  const normalPrice = productPriceEl.querySelector('div:nth-child(2) > span').textContent;
  const discountPercentage = productImageEl.querySelector('div > div:nth-child(2) > span:nth-child(1)').textContent.replace('>', '');

  const ratingParentEl = el.querySelector('img[alt="rating"]')
    ?.parentElement
    ?.parentElement;

  // look for "x terjual"
  let soldCount = 0;
  const elements = el.querySelectorAll('div > span');
  const soldEl = Array.from(elements).find(el =>
    el.textContent.trim().match(/^\d+\s*terjual$/i)
  );

  if (soldEl) {
    soldCount = Normalize.soldCounter(soldEl.textContent);
  }

  const productCardData = {
    url: productLink,
    imageUrl: productImageUrl,
    name: productName,
    discountPrice: Normalize.price(discountPrice),
    normalPrice: Normalize.price(normalPrice),
    discountPercentage: Normalize.discountPercentage(discountPercentage),
    ratingAvg: ratingParentEl ? Number(ratingParentEl.querySelector('span').textContent) : 0,
    soldCount: soldCount,
  }

  products.push(productCardData);
});

const data = {
  origin: location.href,
  domain: domain,
  store: {
    name: document.querySelector('[data-testid="shopNameHeader"]').textContent,
    imageUrl: document.querySelector('[data-testid="shopProfilePictureHeader"] img').getAttribute('src'),
    meta: {
      title: document.querySelector('meta[name="title"]').getAttribute('content'),
      description: document.querySelector('meta[name="description"]').getAttribute('content'),
    }
  },
  data: products
}

console.log(data);

const jsonStr = JSON.stringify(data, null, 2); // Pretty-printed
const blob = new Blob([jsonStr], { type: "application/json" });
const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
link.download = `${data.store.name}_products.json`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url); // Clean up
