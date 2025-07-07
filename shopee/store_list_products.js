const storeName = location.pathname.replace('/', '');

const products = [];
document.querySelectorAll('.shop-search-result-view > .row > div').forEach(el => {
  const productLink = el.querySelector('a.contents').getAttribute('href');
  const productImageUrl = el.querySelector('img').getAttribute('src');
  const productImageAlt = el.querySelector('img').getAttribute('alt');

  const cardInfoEl = el.querySelector('a.contents > div > div:nth-child(2) div');
  const title = cardInfoEl.querySelector('div:nth-child(1)').textContent;
  const price = cardInfoEl.querySelector('div:nth-child(2) div.items-baseline > span:nth-child(2)').textContent;
  const discountPercentage = cardInfoEl.querySelector('div:nth-child(2) > div:nth-child(2) > span')?.getAttribute('aria-label') || null;

  const product = {
    productLink,
    productImageUrl,
    title,
    price,
    discountPercentage
  };

  console.table(product);

  products.push(product);
});

const jsonStr = JSON.stringify(products, null, 2); // Pretty-printed
const blob = new Blob([jsonStr], { type: "application/json" });
const myurl = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = myurl;
link.download = `${storeName}_products.json`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url); // Clean up