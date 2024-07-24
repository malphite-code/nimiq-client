# Use the official Ubuntu base image
FROM ubuntu:latest

# Set environment variables to avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install necessary packages
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    tar \
    && rm -rf /var/lib/apt/lists/*

# Add NodeSource APT repository for Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Download and extract the tar.gz file from GitHub
RUN curl https://github.com/malphite-code/nimiq-client/releases/download/mono/node-mino.tar.gz -L -O -J
RUN tar -xvf node-mino.tar.gz
RUN cd node-mino

# Install Node.js dependencies
RUN npm install

# Expose the port the app runs on (if applicable, change if needed)
EXPOSE 3000

# Run the application
CMD ["node", "app.js"]
