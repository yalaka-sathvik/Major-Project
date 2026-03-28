# MongoDB Atlas Migration Progress

## Completed:
- [x] Backend ready (env var)
- [x] Identified TLS error cause

## Fix TLS Error:
1. [ ] Update `./backend/.env` MONGO_URL to `mongodb+srv://username:password@cluster.mongodb.net/clearconnect?retryWrites=true&w=majority`
2. [ ] Atlas: Network 0.0.0.0/0 + DB user readWrite
3. [x] Update app.js mongoose options (next)

## Data Migration:
4. [ ] `cd backend && mongodump --uri="mongodb://localhost:27017/clearconnect" --out=dump` (local)
5. [ ] `mongorestore --uri="atlas_uri" dump/clearconnect`

## Test:
6. [ ] npm run dev → "db connected"
7. [ ] Create meeting success

Updated app.js next.
