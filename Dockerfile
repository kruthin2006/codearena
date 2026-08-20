FROM node:18

# Install Java and C++
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk g++ && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

# Set working directory
WORKDIR /app

# Copy ALL backend files
COPY backend /app/backend
WORKDIR /app/backend
RUN npm install

# Copy ALL frontend files
COPY frontend /app/frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Go back to root
WORKDIR /app

# Copy other files
COPY . .

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "backend/server-file.js"]