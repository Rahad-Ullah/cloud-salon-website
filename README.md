# Cloud Salon ✂️

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=flat-square&logo=socket.io)](https://socket.io/)

**Cloud Salon** is a modern, full-stack marketplace and management platform tailored for the beauty and wellness industry. It connects **Salon Owners**, **Independent Beauty Professionals**, and **Customers** in a single ecosystem, combining appointment booking with chair/booth rental infrastructure.

---

## 🌟 Key Highlights

- **Multi-Sided Platform**: Built-in support for three primary user roles: Customers, Professionals, and Salon Businesses.
- **Chair & Workspace Rental Marketplace**: Salon owners can monetize unoccupied styling stations; independent stylists can rent workstations flexibly.
- **End-to-End Booking Flow**: Discover nearby salons/stylists, view real-time availability, select services, and book appointments seamlessly.
- **Interactive Maps & Geolocation**: Integrated with Google Maps, Places Autocomplete, and Leaflet for location-based search and salon discovery.
- **Real-Time Communication**: Live chat powered by Socket.IO, complemented by an interactive virtual assistant chatbot.
- **Role-Based Routing & Security**: Automated JWT-based session validation and dynamic route redirection via Next.js Middleware.
- **Modern UI & Micro-Interactions**: Built using Tailwind CSS v4, Radix UI / Shadcn, Framer Motion, GSAP, and Lenis smooth scrolling.

---

## 👥 User Roles & Portals

```
                         ┌───────────────────────┐
                         │   Cloud Salon Core    │
                         └──────────┬────────────┘
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     Customer     │       │   Professional   │       │ Salon / Business │
│  Portal & Search │       │  Space & Bookings│       │  Chairs & Staff  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### 1. Customers (`/customer`)
- **Discover & Filter**: Search salons and stylists by location, category, ratings, and price range.
- **Appointments**: Real-time calendar booking, service customizer, and schedule tracker.
- **History & Feedback**: Review past services, submit ratings, and manage personal profile & wishlist.

### 2. Independent Professionals (`/professional`)
- **Chair Rentals**: Explore available salon booths/chairs, review amenities, and submit rental agreements.
- **Service & Client Management**: Configure service menus, pricing, schedules, and maintain client directories.
- **Analytics & Earnings**: Track booked sessions, completed client visits, revenue, and client feedback.

### 3. Salon Owners & Businesses (`/business`)
- **Workspace Monetization**: List chairs, private suites, and stations with daily/weekly/monthly rates.
- **Salon Operations**: Manage staff rosters, chair occupancies, operating hours, and customer bookings.
- **Business Performance**: High-level financial reporting, booking stats, and salon profile customization.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Server Actions) |
| **Frontend Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), `@tailwindcss/postcss` |
| **Component Primitives** | [Radix UI](https://www.radix-ui.com/), `@base-ui/react`, [Shadcn UI](https://ui.shadcn.com/) |
| **Animations & Motion** | [Framer Motion](https://www.framer.com/motion/), [GSAP](https://greensock.com/gsap/), [Lenis](https://lenis.darkroom.engineering/) |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) |
| **Mapping & Location** | [Google Maps API](https://developers.google.com/maps), [Leaflet](https://leafletjs.com/), `use-places-autocomplete` |
| **Real-Time & Chat** | [Socket.IO Client](https://socket.io/), [React Chatbotify](https://react-chatbotify.com/) |
| **Charts & Metrics** | [Recharts](https://recharts.org/), [date-fns](https://date-fns.org/) |
| **Internationalization** | [i18next](https://www.i18next.com/), `react-i18next` |

---

## 📁 Project Structure

```bash
cloud-salon-website/
├── app/
│   ├── (auth)/                # Auth flows (login, register, OTP, forgot-password)
│   ├── (business)/business/   # Salon business dashboard (chairs, staff, bookings)
│   ├── (customer)/customer/   # Client portal (appointments, overview, reviews)
│   ├── (main)/                # Public pages (home, search, salons, workspaces, terms)
│   ├── (professional)/        # Freelancer portal (rentals, schedule, earnings)
│   ├── api/                   # Internal API route handlers
│   ├── onboarding/            # Guided onboarding for salon owners & professionals
│   ├── globals.css            # Tailwind CSS v4 styling entry point
│   └── layout.tsx             # Root layout with theme providers & toast notifications
├── components/                # Reusable UI widgets, layout blocks, modals, and forms
├── features/                  # Domain-driven modules (appointments, salons, chairs, chat)
├── hooks/                     # Custom React hooks
├── lib/                       # Utility helpers, API wrappers, and client configurations
├── public/                    # Static assets, logos, and placeholders
├── utils/                     # Global constants, BaseURL helpers, and encoders
├── middleware.ts              # Route protection, role resolution & redirection
└── types.ts                   # Core TypeScript domain entities & interfaces
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `18.18.0` or higher (Node 20+ recommended)
- **Package Manager**: `npm`, `yarn`, `pnpm`, or `bun`

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/cloud-salon-website.git
cd cloud-salon-website

# Install packages
npm install
# or
yarn install
```

### 2. Configure Environment Variables

Create a `.env` or `.env.local` file in the project root:

```env
# Backend API Base URL
NEXT_PUBLIC_BASE_URL=https://api.thecloudsalon.com

# Google Maps API Key (Places Autocomplete & Maps)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🔐 Authentication & Role-Based Routing

The app features cookie-based JWT authentication managed via [`middleware.ts`](file:///c:/Users/Rahad-Ullah/projects/cloud-salon-website/middleware.ts):

- **`salon-token` / `salon-role`**: Cookies storing the current user session and active role (`customer`, `professional`, `business`).
- **Route Guarding**:
  - Unauthenticated access to protected portals automatically redirects to `/login`.
  - Authenticated visits to `/login` or `/register` route straight to the user's role-specific dashboard.
  - Role mismatches are redirected to the corresponding authorized dashboard.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server at `localhost:3000` with hot-reloading. |
| `npm run build` | Compiles and optimizes the application for production deployment. |
| `npm run start` | Boots the compiled Next.js production server. |
| `npm run lint` | Runs ESLint to check for code quality and convention issues. |

---

## 🤝 Contributing

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this source code is strictly prohibited.
