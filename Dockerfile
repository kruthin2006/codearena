FROM node:18

# Install Java and C++
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk g++ && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

WORKDIR /app

# Copy backend first
COPY backend /app/backend
WORKDIR /app/backend
RUN npm install

# Copy frontend
COPY frontend /app/frontend
WORKDIR /app/frontend

# ✅ FIX: Install react-scripts globally first
RUN npm install -g react-scripts

# Then install local dependencies
RUN npm install

# ✅ Build using the global react-scripts
RUN react-scripts build

EXPOSE 5000

CMD ["node", "/app/backend/server-file.js"]