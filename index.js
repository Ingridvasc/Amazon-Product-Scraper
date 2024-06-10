const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/scrape', async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) {
    return res.status(400).json({ error: 'Keyword query parameter is required' });
  }

  try {
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const productElements = document.querySelectorAll('.s-result-item');
    const products = Array.from(productElements).map(productElement => {
      const title = productElement.querySelector('h2 a span')?.textContent || '';
      const rating = productElement.querySelector('.a-icon-alt')?.textContent || '';
      const reviews = productElement.querySelector('.a-size-small .a-link-normal')?.textContent || '';
      const imageUrl = productElement.querySelector('.s-image')?.getAttribute('src') || '';

      return { title, rating, reviews, imageUrl };
    }).filter(product => product.title);

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while scraping the data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
