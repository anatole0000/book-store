# Dockerfile
FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Build nếu bạn dùng build step (nếu không dùng ts-node)
# RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
