FROM node:8.11.1
WORKDIR /src/app
COPY ./package.json .
RUN npm install
COPY . .
CMD npm start
