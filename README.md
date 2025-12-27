# Toko Product Exporter (Marketplace Data Extractor)

A tool to export product details and store listings from **Shopee** and **Tokopedia**. Available as a convenient Chrome Extension or standalone scripts.

## Features
- **Multi-Platform Support**: Works on both Shopee and Tokopedia.
- **Context Aware**: Automatically detects if you are on a Product Detail page or a Store Page and shows the relevant export button.
- **Dual Export Modes**:
  - **Store List**: Exports all visible products on a store's list page.
  - **Product Detail**: Exports detailed information (variants, price, stock, description, etc.) from a single product page.
- **Auto-Download**: Automatically downloads the exported data as a JSON file.

## Chrome Extension (Recommended)

The easiest way to use the exporter is via the Chrome Extension.

### Installation

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) installed.
2. **Build the Extension**:
   ```bash
   cd chrome-extension
   npm install
   npm run build
   ```
   This will create a `dist` folder containing the compiled extension.

3. **Load into Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle in the top-right corner).
   - Click **Load unpacked**.
   - Select the `toko-scrape/chrome-extension/dist` folder.

### How to Use

1. **Navigate**: Go to a Shopee or Tokopedia page.
   - **Product Page**: e.g., `shopee.co.id/product/...` or `tokopedia.com/shop/product`
   - **Store Page**: e.g., `shopee.co.id/shopname` or `tokopedia.com/shopname`
2. **Open Extension**: Click the extension icon in your browser toolbar.
3. **Export**:
   - The extension will automatically detect the page type.
   - Click the displayed button (e.g., **"Export Product Detail"** or **"Export Store Products"**).
4. **Download**: The exported data will be saved immediately as a `.json` file in your downloads folder.

> **Note**: If you encounter a connection error after navigating, the extension will automatically attempt to inject the script and retry.

---

## Manual Usage (Script Injection)

If you prefer not to install the extension, you can run the scripts manually via the browser console.

1. **Open Platform Folder**: Navigate to `shopee/` or `tokopedia/` in this repository.
2. **Select Script**: Choose the script you need (e.g., `product_detail.js` or `store_list_products.js`).
3. **Go to Website**: Open the corresponding page in your browser.
4. **Open Console**: Right-click > Inspect > **Console** tab (or press F12).
5. **Paste & Run**: Copy the content of the `.js` file, paste it into the console, and hit Enter.
6. **Download**: The JSON file will be downloaded automatically.

## Disclaimer

Please note that the DOM structure of these marketplaces changes frequently. If the script stops working, selectors may need to be updated. This tool is for educational purposes only.

**Important:**
- This tool is **not affiliated with Tokopedia or Shopee**.
- This extension **does not bypass authentication, paywalls, or private APIs**. It only collects data visible on the public page.
- **Data Privacy**: All processing is done locally on your device. No personal data is collected or transmitted to external servers.