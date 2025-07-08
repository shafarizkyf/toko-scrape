/**
 * input: "https://img.com/file/xxx@resize_w82_nl.webp 1x, https://img.com/file/xxx@resize_w164_nl.webp 2x"
 * return: https://img.com/file/xxx
 */
function extractBaseImage(input) {
  const match = input.match(/https:\/\/[^@,]+/);
  return match ? match[0] : null;
}

function removeClassAttributes(html) {
  return html.replace(/\s*class="[^"]*"/g, '');
}

const containerEl = document.querySelector('div[role="main"].container');
const breadcrumb = containerEl.querySelector('.page-product__breadcrumb');
const contentEl = containerEl.querySelector('section')
const mediaEl = contentEl.querySelector('section:nth-child(1) > div:nth-child(1)');
const buySectionEl = contentEl.querySelector('section:nth-child(2) > div:nth-child(1)');
const productDetailEl = containerEl.querySelector('.product-detail.page-product__detail');
const shopEl = containerEl.querySelector('section.page-product__shop');

const categories = [];
breadcrumb.querySelectorAll('a').forEach(el => {
  categories.push({
    name: el.textContent,
    url: el.getAttribute('href')
  });
});

// get video url from current active slider
const videoUrl = mediaEl.querySelector('video')?.getAttribute('src');

// image slider
const images = [];
mediaEl.querySelectorAll('div:nth-child(2) > div source').forEach(el => {
  const imageSet = el.getAttribute('srcset');
  const imageBaseUrl = extractBaseImage(imageSet);
  images.push(imageBaseUrl);
});

// product detail section
let productDescription = null;
productDetailEl.querySelectorAll('section').forEach(el => {
  const sectionName = el.querySelector('h2').textContent;
  if (sectionName.toLocaleLowerCase() === 'deskripsi produk') {
    productDescription = productDetailEl.querySelector('section:nth-child(2) > div > div').innerHTML
  }
});

// variant section
const variantsEl = buySectionEl
  .querySelector('div.shopee-input-quantity')
  .closest('section')
  .parentElement // variant section and quantity input has the same parent

const hasVariantSection = variantsEl.childElementCount > 1;

const variants = [];
if (hasVariantSection) {
  // -1, to not include quantity container
  for(let i = 0; i < variantsEl.childElementCount - 1; i++) {
    const variantEl = variantsEl.childNodes[i];
    const variantName = variantEl.querySelector('h2').textContent;

    // variant options
    const variantOptions = [];
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

const priceSectionEl = buySectionEl.querySelector('section > div');
const shopName = shopEl
  .querySelector('button') // button "Chat Sekarang" or "Kunjungi Toko"
  .parentElement
  .parentElement
  .firstChild
  .textContent

const product = {
  name: buySectionEl.querySelector('div:nth-child(1) > h1').textContent,
  categories,
  images,
  reviewAvg: buySectionEl.querySelector('div:nth-child(2) > button:nth-child(1) > div').textContent,
  reviewCount: buySectionEl.querySelector('div:nth-child(2) > button:nth-child(2) > div:nth-child(1)').textContent,
  salesCount: buySectionEl.querySelector('div:nth-child(2) > div span').textContent,
  price: priceSectionEl.querySelector('div:nth-child(1)').textContent,
  originalPrice: priceSectionEl.querySelector('div:nth-child(2)').textContent,
  discountPercentage: priceSectionEl.querySelector('div:nth-child(3)').textContent,
  description: removeClassAttributes(productDescription),
  shopName,
  variants,
};

console.log({ product })

const jsonStr = JSON.stringify(product, null, 2); // Pretty-printed
const blob = new Blob([jsonStr], { type: "application/json" });
const myurl = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = myurl;
link.download = `${product.name}.json`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(myurl); // Clean up
