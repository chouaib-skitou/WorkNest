FROM node:18-alpine

WORKDIR /app

COPY .babelrc ./
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5002

CMD ["npm", "start"]