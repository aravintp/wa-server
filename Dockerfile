FROM node:lts-alpine
RUN apk add --no-cache python3 g++ make
WORKDIR /
COPY . .
RUN yarn install --production
CMD ["node", "/index.js"]