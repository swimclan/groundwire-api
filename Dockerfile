FROM node:latest

#create app folder
RUN mkdir /tradingapi
WORKDIR /tradingapi

#cache npm dependencies
COPY package.json /tradingapi
RUN npm install

#copy application files
COPY . /tradingapi

#run the application in the image
EXPOSE 3000
CMD ["node", "bin/www"]
