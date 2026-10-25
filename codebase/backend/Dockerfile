FROM node:24-alpine AS base

WORKDIR /bizbandhan/soochak
COPY package.json .
RUN npm install

FROM base AS development

COPY . .
CMD [ "npm","run","dev" ]

FROM base AS production

COPY . .
CMD [ "npm","run","start" ]