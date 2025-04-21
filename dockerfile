FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=development
ENV PORT=8000

EXPOSE 8000

COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]
