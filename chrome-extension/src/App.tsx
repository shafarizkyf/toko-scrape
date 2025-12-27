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
      chrome.tabs.sendMessage(tab.id, { action }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('error');
          setMessage('Error: ' + chrome.runtime.lastError.message);
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
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <div className="popup-container">
      <h1>Marketplace Scraper</h1>
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
    </div>
  )
}

export default App
