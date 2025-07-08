class Normalize {
  static price(valueStr) {
    return Number(valueStr.replace('Rp', '').replace(/\./g, ''));
  }

  static discountPercentage(valueStr) {
    return Number(valueStr.replace('%', ''))
  }

  static reviewCount(valueStr) {
    const valueWithUnit = valueStr
      .replace('(', '')
      .replace(')', '')
      .replace(',', '.')
      .split(' ');

    let amount = Number(valueWithUnit[0]);
    const unit = valueWithUnit[1]

    if (unit.toLocaleLowerCase() === 'rb') {
      amount *= 1000;
    }

    return amount;
  }

  static variantionName(valueStr) {
    return valueStr.replace(/^Pilih\s*/i, "").replace(/:\s*$/, "");
  }
}

// breadcrumb section
const categories = [];
document.querySelectorAll('[data-testid="lnkPDPDetailBreadcrumb"] li').forEach(el => {
  const categoryName = el.getAttribute('text');
  const categoryUrl = el.getAttribute('url');

  categories.push({ name: categoryName, url: categoryUrl });
});

// image slider
const images = [];
document.querySelectorAll('[data-testid="PDPImageThumbnail"] img').forEach(el => {
  // sample thumbnail url: https://images.tokopedia.net/img/cache/200/o3syd0/1997/1/1/bdf06eb30e0a414097b35d228abab270~.jpeg.webp
  // will return static asset for image that is not visible to the viewport
  const imageSmallUrl = el.getAttribute('src');
  // replace `200` to `500-square` to get larger size
  const imageLargeUrl = imageSmallUrl.replace('200', '500-square');

  const imgAlt = el.getAttribute('alt');

  if (imgAlt) {
    images.push({
      image200: imageSmallUrl,
      image500: imageLargeUrl,
      alt: imgAlt,
    });
  }
});

// variant section
const variantOptions = [];
document.querySelectorAll('[data-testid="pdpVariantContainer"] > div > div').forEach(el => {
  const variantionName = el.querySelector('p > b').textContent;

  const options = [];
  el.querySelectorAll('button').forEach(optionEl => {
    const statusUnformatted = optionEl.parentElement.getAttribute('data-testid').toLocaleLowerCase();

    let status = null;
    if (statusUnformatted.includes('selected')) {
      status = 'selected'
    } else if (statusUnformatted.includes('inactive')) {
      status = 'inactive'
    } else if (statusUnformatted.includes('active')) {
      status = 'active';
    }

    options.push({
      name: optionEl.textContent,
      status
    });
  });

  variantOptions.push({
    name: Normalize.variantionName(variantionName),
    options
  });
});

const info = {}
document.querySelectorAll('[data-testid="lblPDPInfoProduk"] li').forEach(el => {
  const property = el.querySelector('span:nth-child(1)').textContent.toLocaleLowerCase();

  if (property.includes('kondisi')) {
    info.condition = el.querySelector('span.main').textContent;
  } else if (property.includes('min. pemesanan')) {
    info.minimum_order = el.querySelector('span.main').textContent;
  } else if (property.includes('etalase')) {
    info.display = {
      name: el.querySelector('a > b').textContent,
      url: el.querySelector('a').getAttribute('href')
    };
  }
});

const price = document.querySelector('[data-testid="lblPDPDetailProductPrice"]').textContent;
const ratingEl = document.querySelector('[id="pdp_comp-shop_credibility"] > div:nth-child(2) p');

const soldCount = document.querySelector('[data-testid="lblPDPDetailProductSoldCounter"]').textContent
  .replace('Terjual', '')
  .replace('+', '')
  .trim();

const product = {
  origin: location.href,
  name: document.querySelector('h1[data-testid="lblPDPDetailProductName"]').textContent,
  description: document.querySelector('[data-testid="lblPDPDescriptionProduk"]').textContent,
  price: Normalize.price(price),
  stock: Number(document.querySelector('[data-testid="stock-label"] b').textContent),
  originalPrice: Normalize.price(document.querySelector('[data-testid="lblPDPDetailOriginalPrice"]')?.textContent || price),
  discountPercentage: Normalize.discountPercentage(document.querySelector('[data-testid="lblPDPDetailDiscountPercentage"]')?.textContent || ''),
  categories,
  images,
  variants: variantOptions,
  info,
  shopName: document.querySelector('[data-testid="llbPDPFooterShopName"] h2').textContent,
  reviewAvg: Number(ratingEl.querySelector('span:nth-child(1)').textContent),
  reviewCount: Normalize.reviewCount(ratingEl.querySelector('span:nth-child(2)').textContent),
  soldCount: Number(soldCount),
};

console.log(product)

const jsonStr = JSON.stringify(product, null, 2); // Pretty-printed
const blob = new Blob([jsonStr], { type: "application/json" });
const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
link.download = `${product.name}.json`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url); // Clean up

