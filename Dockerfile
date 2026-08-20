FROM node:18

# Install Java and C++
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk g++ && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

WORKDIR /app

# Copy backend
COPY backend /app/backend
WORKDIR /app/backend
RUN npm install

# Use pre-built frontend (no React build needed!)
COPY frontend/build /app/frontend/build

EXPOSE 5000

CMD ["node", "backend/server-file.js"]