import requests
import json

# Replace with your actual Todoist API token
API_TOKEN = "9e3ef17f78edb62a00340ba01a094975f7567245"

# Todoist API endpoint
URL = "https://api.todoist.com/rest/v2/projects"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

# Create project
project_data = {
    "name": "Human Values Analysis Project",
    "description": "Comprehensive analysis of human values from various sources including philosophy, psychology, sociology, linguistics, ethics, religion, and literature."
}

response = requests.post(URL, headers=headers, data=json.dumps(project_data))

if response.status_code == 200:
    project = response.json()
    project_id = project["id"]
    print(f"Project created successfully. ID: {project_id}")
else:
    print(f"Failed to create project. Status code: {response.status_code}")
    print(response.text)
    exit()

# Tasks to be added
tasks = [
    "Review and improve existing SEP scraper",
    "Design overall system architecture",
    "Implement web scraper for Internet Encyclopedia of Philosophy",
    "Develop processor for philosophical texts (e.g., Aristotle, Kant, Mill)",
    "Create API client for ConceptNet",
    "Implement scraper for World Values Survey data",
    "Develop processor for psychological research papers",
    "Create processor for religious texts",
    "Implement data model and storage solution using MongoDB",
    "Set up Elasticsearch for advanced search capabilities",
    "Develop data processing pipeline for cleaning and structuring data",
    "Implement error handling and logging system",
    "Set up monitoring system for scrapers and processors",
    "Develop configuration management system",
    "Implement data validation and quality assurance measures",
    "Create documentation for system architecture",
    "Write user guide for adding new data sources",
    "Develop API for accessing processed data",
    "Implement visualization tools for data exploration",
    "Conduct initial data analysis and generate insights",
    "Review and ensure compliance with ethical web scraping practices",
    "Set up continuous integration and deployment pipeline",
    "Perform security audit of the entire system",
    "Develop backup and recovery procedures",
    "Plan for scaling the system to handle larger datasets"
]

# Add tasks to the project
task_url = "https://api.todoist.com/rest/v2/tasks"

for task in tasks:
    task_data = {
        "content": task,
        "project_id": project_id
    }
    response = requests.post(task_url, headers=headers, data=json.dumps(task_data))
    if response.status_code == 200:
        print(f"Task added: {task}")
    else:
        print(f"Failed to add task: {task}. Status code: {response.status_code}")

print("Project setup complete!")