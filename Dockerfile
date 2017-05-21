FROM node:latest

#create app folder
RUN mkdir /opt/groundwire/node/tradingapi
WORKDIR /opt/groundwire/node/tradingapi

#cache npm dependencies
COPY package.json /opt/groundwire/node/tradingapi
RUN npm install

#copy application files
COPY . /opt/groundwire/node/tradingapi

#run the application in the image
CMD ["node", "bin/www"]
