#!/bin/bash

# Install Docker and Docker Compose (check if they are installed first)
if ! command -v docker &> /dev/null; then
    echo "Docker not found, installing..."
    sudo apt install -y docker.io
else
    echo "Docker is already installed."
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found, installing..."
    sudo apt install -y docker-compose
else
    echo "Docker Compose is already installed."
fi

# Pull MySQL image
sudo docker pull mysql:8.0

# Check if the file APIkey.txt exists
if [[ ! -f "APIkey.txt" ]]; then
    # If the file doesn't exist, prompt the user for the API key
    echo "Please enter your API key for your AI assistant:"
    read user_input
    echo "$user_input" > APIkey.txt
    echo "API key saved to APIkey.txt"
else
    echo "API key already exists. No need to prompt again."
fi

# Build and start the services
sudo docker-compose up --build
# sudo docker-compose build
# sudo docker-compose up
