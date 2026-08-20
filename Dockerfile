FROM node:18

# Install Java and C++
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk g++ && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

WORKDIR /app

# Copy ALL frontend files FIRST
COPY frontend/ /app/frontend

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Copy backend files
COPY backend/ /app/backend
WORKDIR /app/backend
RUN npm install

# Copy other files
COPY . .

EXPOSE 5000

CMD ["node", "server-file.js"]