import scrapy
import os
import re
import hashlib
import json
from datetime import datetime
from typing import Set, Dict, Any, Optional
from scrapy.http import Response
import logging
from scrapy.utils.log import configure_logging

class SEPSpider(scrapy.Spider):
    name = 'sep_spider'
    allowed_domains = ['plato.stanford.edu']
    start_urls = ['https://plato.stanford.edu/contents.html']

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super(SEPSpider, self).__init__(*args, **kwargs)
        self.config = self.load_config()
        self.downloaded_files: Set[str] = set()
        self.stats: Dict[str, int] = {
            'articles_scraped': 0,
            'articles_skipped': 0,
            'errors': 0
        }
        self.setup_environment()
        self.setup_logging()

    def load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file or use default values."""
        default_config = {
            'base_path': 'downloaded_content',
            'source': 'stanford_encyclopedia_philosophy',
            'file_extension': '.txt',
            'user_agent': 'SEPSpider (+https://example.com)',
            'download_delay': 2,
            'concurrent_requests': 1
        }
        try:
            import yaml
            with open('spider_config.yaml', 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            self.logger.warning(f"Error loading configuration: {str(e)}. Using default configuration.")
            return default_config

    def setup_environment(self) -> None:
        """Set up the necessary environment for the spider."""
        os.makedirs(self.config['base_path'], exist_ok=True)
        self.load_existing_files()

    def setup_logging(self) -> None:
        """Set up custom logging configuration."""
        configure_logging(install_root_handler=False)
        logging.basicConfig(
            filename=f'{self.name}.log',
            format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
            level=logging.INFO
        )

    def load_existing_files(self) -> None:
        """Load existing files into memory."""
        source_path = os.path.join(self.config['base_path'], self.config['source'])
        if os.path.exists(source_path):
            for root, _, files in os.walk(source_path):
                for file in files:
                    if file.endswith(self.config['file_extension']):
                        self.downloaded_files.add(file)
        self.logger.info(f"Found {len(self.downloaded_files)} existing files")

    def parse(self, response: Response):
        """Parse the main page and yield requests for article pages."""
        self.logger.info(f"Parsing main page: {response.url}")
        
        # Print out the HTML content for debugging
        self.logger.info("HTML content of the main page:")
        self.logger.info(response.text)
        
        # Try different CSS selectors
        selectors = [
            'div.entries ul li a::attr(href)',
            'table.contents a::attr(href)',
            'a::attr(href)'
        ]
        
        for selector in selectors:
            links = response.css(selector).getall()
            self.logger.info(f"Selector '{selector}' found {len(links)} links")
        
        # Use the most general selector for now
        links = response.css('a::attr(href)').getall()
        self.logger.info(f"Found {len(links)} links on the main page")
        
        for href in links:
            url = response.urljoin(href)
            yield scrapy.Request(url, callback=self.parse_article)

    def parse_article(self, response: Response):
        """Parse an article page and save its content."""
        self.logger.info(f"Parsing article: {response.url}")
        
        title = response.css('h1::text').get()
        content = ' '.join(response.css('div#main-text *::text').getall())
        
        if not title or not content:
            self.logger.warning(f"Could not extract title or content from {response.url}")
            self.stats['errors'] += 1
            return

        filename = self.sanitize_filename(f"{title.lower()}{self.config['file_extension']}")
        if filename in self.downloaded_files:
            self.logger.info(f"File {filename} already exists, skipping")
            self.stats['articles_skipped'] += 1
            return

        filepath = self.get_filepath(filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        try:
            self.save_and_validate_file(filepath, content)
            self.logger.info(f"Successfully saved and validated file {filename}")
            self.downloaded_files.add(filename)
            self.stats['articles_scraped'] += 1
        except Exception as e:
            self.logger.error(f"Error saving file {filename}: {str(e)}")
            self.stats['errors'] += 1

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize the filename by removing invalid characters."""
        filename = re.sub(r'[\\/*?:"<>|]', "", filename)
        filename = filename.replace(' ', '_')
        return filename[:250]

    def get_filepath(self, filename: str) -> str:
        """Generate the full filepath for a given filename."""
        date_path = datetime.now().strftime('%Y/%m/%d')
        return os.path.join(self.config['base_path'], self.config['source'], date_path, filename)

    def save_and_validate_file(self, filepath: str, content: str) -> None:
        """Save the file and validate its content."""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        with open(filepath, 'r', encoding='utf-8') as f:
            saved_content = f.read()
        
        if self.calculate_hash(saved_content) != self.calculate_hash(content):
            raise Exception(f"File validation failed for {filepath}")

    @staticmethod
    def calculate_hash(content: str) -> str:
        """Calculate the MD5 hash of the given content."""
        return hashlib.md5(content.encode('utf-8')).hexdigest()

    def closed(self, reason):
        """Handle spider closure and save statistics."""
        self.logger.info("Spider closing")
        self.log_stats()
        self.save_stats()

    def log_stats(self) -> None:
        """Log the spider statistics."""
        for key, value in self.stats.items():
            self.logger.info(f"{key.replace('_', ' ').capitalize()}: {value}")

    def save_stats(self) -> None:
        """Save the spider statistics to a JSON file."""
        stats_file = os.path.join(self.config['base_path'], f'{self.name}_stats.json')
        try:
            with open(stats_file, 'w') as f:
                json.dump(self.stats, f)
            self.logger.info(f"Stats saved to {stats_file}")
        except Exception as e:
            self.logger.error(f"Error saving stats file: {str(e)}")

# To run this spider, save it in a file named sep_spider.py and use:
# scrapy runspider sep_spider.py -s LOG_LEVEL=DEBUG