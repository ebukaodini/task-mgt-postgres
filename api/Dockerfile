# pull base image
FROM node:18-bullseye-slim

WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH

COPY package.json package-lock.json ./

RUN npm ci --production

# install dev deps
RUN npm ci 

COPY . /app

EXPOSE 4000

EXPOSE 5432

RUN npm run prisma:generate

RUN npm run build

RUN cd build

CMD [ "npm", "run", "start:docker" ]
