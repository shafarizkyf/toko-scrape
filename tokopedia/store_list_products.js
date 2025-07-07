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

  const productCardData = {
    productLink,
    productImageUrl,
    productName,
    discountPrice,
    normalPrice,
    discountPercentage
  }

  products.push(productCardData);
});

console.log(products);

const jsonStr = JSON.stringify(products, null, 2); // Pretty-printed
const blob = new Blob([jsonStr], { type: "application/json" });
const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
link.download = "products.json";
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url); // Clean up
