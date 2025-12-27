import { useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState<'idle' | 'scraping' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);

  const handleScrape = async (action: 'SCRAPE' | 'SCRAPE_DETAIL') => {
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
      <h1>Shopee Scraper</h1>
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => handleScrape('SCRAPE')} disabled={status === 'scraping'}>
            {status === 'scraping' ? 'Scraping...' : 'Scrape Products (List)'}
          </button>
          <button onClick={() => handleScrape('SCRAPE_DETAIL')} disabled={status === 'scraping'}>
            {status === 'scraping' ? 'Scraping...' : 'Scrape Product Detail'}
          </button>
        </div>

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
