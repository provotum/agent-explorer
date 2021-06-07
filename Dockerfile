# pull official base image
FROM node:latest

# set working directory
WORKDIR /app

# add app
COPY bin ./bin
COPY build ./build

# serve the app from a node js server
COPY bin/package.json ./
RUN npm install

EXPOSE 9001

# start app
CMD ["npm", "run", "start"]
