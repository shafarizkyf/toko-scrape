import { useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState<'idle' | 'scraping' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);

  const [pageType, setPageType] = useState<'shopee-list' | 'shopee-detail' | 'tokopedia-list' | 'tokopedia-detail' | 'unknown'>('unknown');

  useState(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        const url = tabs[0].url;
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const pathname = urlObj.pathname;
        const segments = pathname.split('/').filter(Boolean);

        if (hostname.includes('shopee.co.id')) {
          // Shopee Logic
          // Product usually ends with -i.{shopId}.{itemId} or contains 'product/'
          if (pathname.match(/-i\.\d+\.\d+$/) || pathname.includes('/product/')) {
            setPageType('shopee-detail');
          } else {
            // Heuristic: Store pages usually are just /storename or /storename/category
            // If it's not a detail page, assume it's a store page (list)
            setPageType('shopee-list');
          }
        } else if (hostname.includes('tokopedia.com')) {
          // Tokopedia Logic
          // Store: /storename
          // Product: /storename/productname
          if (segments.length === 2 && segments[segments.length - 1] === 'product') {
            setPageType('tokopedia-list');
          } else if (segments.length >= 2 && !['etalase', 'review', 'feed', 'timeline'].includes(segments[1])) {
            setPageType('tokopedia-detail');
          }
        }
      }
    });
  });

  const handleScrape = async (action: 'SCRAPE' | 'SCRAPE_DETAIL' | 'SCRAPE_TOKOPEDIA' | 'SCRAPE_TOKOPEDIA_DETAIL') => {
    setStatus('scraping');
    setMessage('Sending scrape command...');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      setStatus('error');
      setMessage('No active tab found');
      return;
    }

    try {
      const sendMessage = (retries = 1) => {
        chrome.tabs.sendMessage(tab.id!, { action }, (response) => {
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message || '';
            // Check if connection error (e.g. "Receiving end does not exist" or "Could not establish connection")
            if (retries > 0 && (errorMsg.includes('Receiving end does not exist') || errorMsg.includes('Could not establish connection'))) {
              console.log('Connection failed, attempting to inject content script...');
              setMessage('Injecting script...');

              // Programmatically inject content script
              chrome.scripting.executeScript({
                target: { tabId: tab.id! },
                files: ['content.js']
              }, () => {
                if (chrome.runtime.lastError) {
                  setStatus('error');
                  setMessage('Injection Error: ' + chrome.runtime.lastError.message);
                } else {
                  // Retry sending message after injection
                  setTimeout(() => sendMessage(retries - 1), 100);
                }
              });
              return;
            }

            setStatus('error');
            setMessage('Error: ' + errorMsg);
            return;
          }

          if (response && response.status === 'success') {
            setStatus('success');
            setCount(response.count);
            setMessage(`Successfully scraped! Check your downloads.`);
          } else {
            setStatus('error');
            setMessage(response?.message || 'Unknown error occurred');
          }
        });
      };

      sendMessage();
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <div className="popup-container">
      <h1>Toko Product Exporter</h1>
      <div className="card">
        {pageType === 'unknown' && (
          <p>Please navigate to a Shopee or Tokopedia page.</p>
        )}

        {(pageType === 'shopee-list') && (
          <>
            <h3>Shopee Store</h3>
            <button onClick={() => handleScrape('SCRAPE')} disabled={status === 'scraping'}>
              {status === 'scraping' ? 'Scraping...' : 'Scrape Store Products'}
            </button>
          </>
        )}

        {(pageType === 'shopee-detail') && (
          <>
            <h3>Shopee Product</h3>
            <button onClick={() => handleScrape('SCRAPE_DETAIL')} disabled={status === 'scraping'}>
              {status === 'scraping' ? 'Scraping...' : 'Scrape Product Detail'}
            </button>
          </>
        )}

        {(pageType === 'tokopedia-list') && (
          <>
            <h3>Tokopedia Store</h3>
            <button onClick={() => handleScrape('SCRAPE_TOKOPEDIA')} disabled={status === 'scraping'}>
              {status === 'scraping' ? 'Scraping...' : 'Scrape Store Products'}
            </button>
          </>
        )}

        {(pageType === 'tokopedia-detail') && (
          <>
            <h3>Tokopedia Product</h3>
            <button onClick={() => handleScrape('SCRAPE_TOKOPEDIA_DETAIL')} disabled={status === 'scraping'}>
              {status === 'scraping' ? 'Scraping...' : 'Scrape Product Detail'}
            </button>
          </>
        )}

        {status === 'success' && (
          <p className="status success">
            Scraped {count} items.
          </p>
        )}
        {message && status !== 'success' && (
          <p className={`status ${status}`}>
            {message}
          </p>
        )}
      </div>
      <footer className="footer">
        <p className="disclaimer">
          Not affiliated with Tokopedia or Shopee. This extension does not bypass authentication, paywalls, or private APIs. Data is processed locally. No personal data is collected.
        </p>
      </footer>
    </div>
  )
}

export default App
