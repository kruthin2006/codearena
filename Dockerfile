FROM node:18

# Install Java and C++
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk g++ && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
RUN cd /app/backend && npm install

# Install frontend dependencies
RUN cd /app/frontend && npm install

# Copy all source code
COPY . .

# ✅ USE NPX to run react-scripts build
RUN cd /app/frontend && npx react-scripts build

EXPOSE 5000

CMD ["node", "backend/server-file.js"]