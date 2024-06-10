const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = process.env.PORT || 3000;

// API endpoint to scrape Amazon product listings
app.get('/api/scrape', async (req, res) => {
  // Get the keyword from query parameter
  const keyword = req.query.keyword;
  if (!keyword) {
    return res.status(400).json({ error: 'Keyword query parameter is required' });
  }

  try {
    // Construct the Amazon search URL
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
    
    // Fetch HTML content from Amazon
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Parse HTML using JSDOM
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Select product elements and extract details
    const productElements = document.querySelectorAll('.s-result-item');
    const products = Array.from(productElements).map(productElement => {
      const title = productElement.querySelector('h2 a span')?.textContent || '';
      const rating = productElement.querySelector('.a-icon-alt')?.textContent || '';
      const reviews = productElement.querySelector('.a-size-small .a-link-normal')?.textContent || '';
      const imageUrl = productElement.querySelector('.s-image')?.getAttribute('src') || '';

      return { title, rating, reviews, imageUrl };
    }).filter(product => product.title); // Filter out products with no title

    // Send the scraped product data as JSON response
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while scraping the data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
