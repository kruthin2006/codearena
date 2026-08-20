FROM node:18

# Install Java and C++
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk g++ && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

# ✅ CREATE /tmp DIRECTORY WITH WRITE PERMISSIONS
RUN mkdir -p /tmp && chmod 777 /tmp

WORKDIR /app

# Copy backend
COPY backend /app/backend
WORKDIR /app/backend
RUN npm install

# Copy frontend build
COPY frontend/build /app/frontend/build

# ✅ CREATE TEMP DIRECTORY
RUN mkdir -p /app/backend/temp && chmod 777 /app/backend/temp

EXPOSE 5000

CMD ["node", "/app/backend/server-file.js"]