FROM node:18-alpine
LABEL authors="David Santiago Cubillos Mendez"
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
