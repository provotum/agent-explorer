# pull official base image
FROM node:12-alpine3.10

# set working directory
WORKDIR /app

# set environment
ENV NODE_ENV docker

# copy production build
COPY bin ./
COPY build ./
COPY package.json ./

# install app dependencies
RUN npm install

# start app
CMD ["npm", "run", "agent-explore"]
