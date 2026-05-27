# MongoDB Local (Borama Food Delivery)

## Automatic setup (recommended)

```bash
npm run setup:local
npm run dev
```

This project uses the MongoDB native driver directly; no ORM migration step is required.

This starts a **project-local** MongoDB on port **27018** (no Administrator rights needed).

| Setting     | Value                  |
| ----------- | ---------------------- |
| Database    | `borama_food_delivery` |
| Port        | `27018`                |
| Replica set | `rs0`                  |
| Data folder | `mongodb/data/`        |

## MongoDB Compass

Use this connection string in MongoDB Compass:

```text
mongodb://127.0.0.1:27018/borama_food_delivery?replicaSet=rs0&directConnection=true
```

You should see the `borama_food_delivery` database and its collections after the app seeds data.

## Daily use

```bash
npm run mongo:start   # start MongoDB if not running
npm run dev
```

## Demo accounts

Password: `password123`

- `customer@boramafood.com`
- `driver@boramafood.com`
- `reception@hoyos.com`
- `admin@boramafood.com`

## Troubleshooting

**Port in use:** Stop other mongod or delete `mongodb/mongod.pid` and run `npm run mongo:start` again.

**Seed errors:** Run `npm run setup:local` again.

**System MongoDB (port 27017):** This project uses **27018** so it does not conflict with your Windows MongoDB service.
