FROM node:20

WORKDIR /app
COPY package*.json ./
RUN npm i pnpm -g
RUN pnpm install

COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm","start"]