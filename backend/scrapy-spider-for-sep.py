import scrapy
import os

class SEPSpider(scrapy.Spider):
    name = 'sep_spider'
    start_urls = ['https://plato.stanford.edu/contents.html']
    
    def parse(self, response):
        # Extract links to all encyclopedia entries
        for href in response.css('ul.entries li a::attr(href)'):
            url = response.urljoin(href.extract())
            yield scrapy.Request(url, callback=self.parse_article)
    
    def parse_article(self, response):
        # Extract the title and content of each article
        title = response.css('h1::text').get()
        content = ' '.join(response.css('div#aueditable *::text').getall())
        
        # Create a filename from the title
        filename = f"sep_{title.replace(' ', '_').lower()}.txt"
        
        # Ensure the 'articles' directory exists
        os.makedirs('articles', exist_ok=True)
        
        # Save the article content to a file
        with open(os.path.join('articles', filename), 'w', encoding='utf-8') as f:
            f.write(content)
        
        yield {
            'title': title,
            'url': response.url,
            'filename': filename
        }

# To run this spider, save it in a file (e.g., sep_spider.py) and use:
# scrapy runspider sep_spider.py
