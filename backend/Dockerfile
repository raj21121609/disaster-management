FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Bundle app source
COPY . .

# Cloud Run sets PORT ENV, but we expose 8080 as documentation
EXPOSE 8080

CMD [ "node", "index.js" ]
