# pull official base image
FROM node:latest

# set working directory
WORKDIR /app

# add app
COPY bin ./
COPY build ./

RUN npm init -y
RUN npm install --save express
RUN npm install --save express-favicon
RUN npm install --save commander

EXPOSE 9001

# start app
CMD ["./bin.js", "serve", "-p 9001"]
