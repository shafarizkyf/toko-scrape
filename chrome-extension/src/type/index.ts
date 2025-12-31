export type Status = 'idle' | 'scraping' | 'success' | 'error';

export type PageType = 'shopee-list' | 'shopee-detail' | 'tokopedia-list' | 'tokopedia-detail' | 'tokopedia-search-result' | 'shopee-search-result' | 'unknown';

export type Action = 'SCRAPE' | 'SCRAPE_DETAIL' | 'SCRAPE_SHOPEE_SEARCH_RESULT' | 'SCRAPE_TOKOPEDIA' | 'SCRAPE_TOKOPEDIA_DETAIL' | 'SCRAPE_TOKOPEDIA_SEARCH_RESULT'