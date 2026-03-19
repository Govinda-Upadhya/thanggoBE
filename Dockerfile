FROM node:22-alpine

WORKDIR ./usr/backend

COPY package*.json .
RUN npm install 

COPY . . 

EXPOSE 3001

CMD ["node","index.js"]