FROM node:22-alpine

RUN mkdir -p /data
WORKDIR /data

EXPOSE 8600

# install dependencies
COPY ./package.json /data
COPY ./package-lock.json /data
RUN npm install

# irrelevant files referenced in .dockerignore
COPY ./ /data

# build the app into dist folder
RUN npm run build

# default command at runtime spins http server up in production mode
CMD [ "npm", "run", "serve:prod" ]
