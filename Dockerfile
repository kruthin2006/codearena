FROM node:18

# Install Java and C++
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk g++ && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

WORKDIR /app

# Copy and install BACKEND dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy and install FRONTEND dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install && npm run build

# Copy all code
COPY . .

EXPOSE 5000

CMD ["node", "backend/server-file.js"]