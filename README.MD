# 📘 MERN Server Setup with Prisma + MongoDB

```bash
# 1️⃣ Initialize Project
mkdir server
cd server
npm init -y

# 2️⃣ Install Core Dependencies
npm install express axios
npm install express-async-handler
npm i cors

# 3️⃣ Install Database Dependencies
# If using Prisma with MongoDB
npm install @prisma/client
npm install prisma --save-dev

# (Optional) If also using Mongoose directly
npm install mongoose
npm install mongodb

# 4️⃣ Developer Tools
npm install -g nodemon       # global hot-reload (or install as dev dependency)
npm install dotenv           # environment variables
npm install --save-dev @types/node --force   # if using TypeScript

# 5️⃣ Setup Prisma
npx prisma init



Client> npm i tailwind@latest . 
npm i tailwindcss @tailwindcss/vite
npm i bcryptjs
npm install jsonwebtoken
npm install twilio
npm i axios

In ML_Model
open each folder and run pip install -r requirements.txt
then run the python train_model.py
then run python app.py
