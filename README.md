# Ai-Powered Multi Role Food Delivery Platform

This project is a full-stack food delivery platform for customers, restaurant staff, drivers, and admin users.
It also includes an AI chatbot for food help and quick user support.

The app is built with:

- **Next.js 15**
- **TypeScript**
- **React**
- **MongoDB**
- **NextAuth**
- **Tailwind CSS**

## What this app can do

### Customer

- Create an account and sign in
- Browse restaurants and food items
- Add items to cart and place an order
- Track order status
- Book a table
- Chat with the AI food bot

### Receptionist / Restaurant Manager

- Edit restaurant profile
- Manage menu categories and menu items
- Accept or decline orders
- Update order status
- Manage table bookings
- View sales and restaurant activity

### Driver

- See delivery requests
- Accept a delivery job
- Update delivery location
- Call the customer or restaurant
- View commission history
- Upload driver documents

### Admin

- See system dashboard numbers
- Approve or suspend users
- Review finance information
- Check disputes
- Monitor platform activity

## Project structure

- `src/app` — app pages, APIs, and role dashboards
- `src/components` — shared UI components
- `src/lib` — database, auth, and utility code
- `src/types` — TypeScript types
- `scripts` — local MongoDB and setup scripts
- `public` — static files and images

## Requirements

- Node.js 18 or newer
- MongoDB installed locally, or MongoDB Atlas in production
- npm

## Local setup

Install dependencies:

```bash
npm install
```

Start the local environment:

```bash
npm run setup:local
```

Run the app:

```bash
npm run dev
```

Open the website:

```text
http://localhost:3000
```

## Database setup

The local database uses:

- host: `127.0.0.1`
- port: `27018`
- database: `borama_food_delivery`

If you want full MongoDB setup details, read **[MONGODB_SETUP.md](./MONGODB_SETUP.md)**.

## Environment variables

Create a `.env` file if you need to change values.

Example values:

```env
DATABASE_URL=mongodb://127.0.0.1:27018/borama_food_delivery?replicaSet=rs0
NEXTAUTH_SECRET=your-strong-secret
NEXTAUTH_URL=http://localhost:3000
```

## Demo accounts

All demo accounts use the same password:

```text
password123
```

| Role         | Email                   |
| ------------ | ----------------------- |
| Admin        | admin@boramafood.com    |
| Receptionist | reception@hoyos.com     |
| Driver       | driver@boramafood.com   |
| Customer     | customer@boramafood.com |

## Available scripts

- `npm run dev` — start the app with local MongoDB
- `npm run build` — create production build
- `npm run start` — run production server
- `npm run lint` — check lint rules
- `npm run setup:local` — start MongoDB and seed demo data
- `npm run seed:users` — create demo users
- `npm run mongo:start` — start MongoDB only
- `npm run mongo:init` — initialize replica set

## Main features

- Role-based login
- Restaurant management
- Live order tracking
- Delivery dispatch
- AI chatbot support
- Booking management
- Sales reporting
- Admin monitoring

## Production notes

- Use a strong `NEXTAUTH_SECRET`
- Use MongoDB Atlas in production
- Always use HTTPS in production
- Set a safe and private `DATABASE_URL`
- Keep database backups enabled

## Troubleshooting

If the app feels slow:

- Check MongoDB is running
- Check `.env` values
- Restart the dev server
- Run `npm run build` to catch type errors

If login fails:

- Make sure demo users were seeded
- Make sure `NEXTAUTH_SECRET` is set
- Make sure the database connection is correct

## License

This project is for learning and development use.

## Author

Built by **AyoubKilwe**.
