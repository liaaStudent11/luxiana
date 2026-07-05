FROM node:20-alpine

WORKDIR /app

# Copy package.json dulu biar layer cache Docker lebih efisien
COPY package*.json ./
RUN npm install --omit=dev

# Copy semua source code
COPY . .

# Port yang dipakai backend (harus sama dengan process.env.PORT di server.js)
EXPOSE 5000

CMD ["node", "server.js"]
