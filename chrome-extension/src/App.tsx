import { useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState<'idle' | 'scraping' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);

  const handleScrape = async () => {
    setStatus('scraping');
    setMessage('Sending scrape command...');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      setStatus('error');
      setMessage('No active tab found');
      return;
    }

    try {
      chrome.tabs.sendMessage(tab.id, { action: "SCRAPE" }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('error');
          setMessage('Error: ' + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.status === 'success') {
          setStatus('success');
          setCount(response.count);
          setMessage(`Successfully scraped ${response.count} products! Check your downloads.`);
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
        <button onClick={handleScrape} disabled={status === 'scraping'}>
          {status === 'scraping' ? 'Scraping...' : 'Scrape Products'}
        </button>

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
