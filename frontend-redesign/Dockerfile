FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5174

# Development server. Set VITE_API_URL (docker-compose.redesign.yml does) to talk to the backend.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]
