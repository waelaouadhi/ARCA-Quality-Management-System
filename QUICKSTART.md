# Quick Start Guide - Fix All 4 Issues

**Status:** Follow these commands in order to fix and start your backend

---

## 🚀 Fast Track (Copy & Paste Commands)

### For Mac/Linux Users:

```bash
# 1️⃣ Make setup script executable
cd /Users/mac/Desktop/Arca_project/QMS-backend
chmod +x SETUP.sh

# 2️⃣ Run setup script (fixes all 4 issues automatically)
./SETUP.sh

# 3️⃣ Start development server
npm run dev
```

### For Windows Users:

```cmd
cd C:\Users\{YourUsername}\Desktop\Arca_project\QMS-backend
SETUP.bat
npm run dev
```

---

## 📋 Manual Setup (If Script Doesn't Work)

### Issue 1️⃣: Start PostgreSQL with Docker

```bash
# Start PostgreSQL container
docker run -d \
  --name qms-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=qms_db \
  -p 5432:5432 \
  postgres:15-alpine

# Verify it's running
docker ps | grep qms-postgres
# Should show: qms-postgres container

# Test connection
docker exec qms-postgres psql -U postgres -d qms_db -c "SELECT 1"
# Should return: (1 row) with value 1
```

### Issue 2️⃣: Database Already Created

✅ **Done!** Docker created `qms_db` automatically via `-e POSTGRES_DB=qms_db`

### Issue 3️⃣: Free Port 4000

```bash
# Check if port is in use
lsof -i :4000

# If in use, kill the process
kill -9 <PID>

# Verify port is free
lsof -i :4000
# Should return nothing
```

### Issue 4️⃣: Install Dependencies

```bash
cd /Users/mac/Desktop/Arca_project/QMS-backend

# Install dependencies
npm install

# Verify installation
ls node_modules | wc -l
# Should show: 200+ packages
```

### Bonus: Setup Prisma & Start Server

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (create database schema)
npx prisma migrate deploy

# Start development server
npm run dev

# Expected output:
# 🚀 Server ready at http://localhost:4000/graphql
# 📊 Health check at http://localhost:4000/health
# 🌍 Environment: development
```

---

## ✅ Verification Checklist

After running setup, verify everything works:

```bash
# 1. Check database is running
docker ps | grep qms-postgres
# ✅ Should show qms-postgres container running

# 2. Check port 4000 is free
lsof -i :4000
# ✅ Should show only Node.js process

# 3. Check dependencies installed
ls /Users/mac/Desktop/Arca_project/QMS-backend/node_modules | wc -l
# ✅ Should show 200+

# 4. Test health endpoint
curl http://localhost:4000/health
# ✅ Should return: {"status":"ok","timestamp":"..."}

# 5. Access GraphQL
# Open browser: http://localhost:4000/graphql
# ✅ Should show Apollo GraphQL interface
```

---

## 🐛 Troubleshooting

### Problem: "Port 4000 already in use"

```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>
```

### Problem: "Cannot connect to database"

```bash
# Check if Docker container is running
docker ps | grep qms-postgres

# If not running, start it
docker start qms-postgres

# If not existing, create it
docker run -d \
  --name qms-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=qms_db \
  -p 5432:5432 \
  postgres:15-alpine
```

### Problem: "Command not found: npm"

```bash
# Install Node.js from https://nodejs.org/
node --version  # Should be v18+
npm --version   # Should be v8+
```

### Problem: "Command not found: docker"

```bash
# Install Docker from https://www.docker.com/products/docker-desktop
docker --version
```

### Problem: "Dependencies not installed"

```bash
cd /Users/mac/Desktop/Arca_project/QMS-backend
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Commands Reference

| Command | What it does |
|---------|--------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server (with hot reload) |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Create/update database schema |
| `npm run prisma:seed` | Seed test data |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix code style |
| `npm test` | Run tests |

---

## ✨ If Everything Works

You should see:

```
2026-04-08 10:50:00:0000 info: 🚀 Server ready at http://localhost:4000/graphql
2026-04-08 10:50:00:0000 info: 📊 Health check at http://localhost:4000/health
2026-04-08 10:50:00:0000 info: 🌍 Environment: development
```

**Then open in browser:** `http://localhost:4000/graphql`

🎉 **Your backend is running!**

---

## 🚀 Next Steps

1. ✅ **Verify backend is running** - See above
2. 📊 **Check database is populated** - Run `npm run prisma:seed` (optional)
3. 🔌 **Start frontend** - Open QMS-frontend in another terminal
4. 🧪 **Test queries** - Use GraphQL playground at http://localhost:4000/graphql
5. 📚 **Review documentation** - See `/docs` folder for architecture details

---

**Questions?** Check TROUBLESHOOTING.md or review the setup script output for specific errors.
