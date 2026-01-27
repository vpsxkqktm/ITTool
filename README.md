# IT Management - IP Subnet Calculator

A Next.js-based web application for calculating IP address ranges and subnets for network management.

## 📋 Project Overview

This project is an IP subnet calculator built with Next.js 14 and TypeScript. It helps network administrators and IT professionals calculate and manage IP address ranges for Class A, B, and C networks. The application allows you to configure different companies and calculate their network address ranges efficiently.

## ✨ Features

- **IP Class Calculation**: Calculate IP address ranges for Class A, B, and C networks
- **Subnet Range Finder**: Determine network ranges based on IP addresses and subnet masks
- **Company Configuration**: Set up and manage different company network configurations
- **Network Information**: View detailed network information including:
  - Network address
  - Broadcast address
  - Usable IP range
  - Number of available hosts
  - Subnet mask

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.1
- **Runtime**: Node.js
- **Deployment**: IIS (Windows Server)

## 📦 Installation & Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development Server

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Production Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Linting

```bash
npm run lint
```

## 🎯 How to Use

1. **Select IP Class**: Choose between Class A, B, or C network
2. **Enter IP Address**: Input the IP address you want to calculate
3. **Specify Subnet Mask**: Enter the subnet mask or CIDR notation
4. **Configure Company**: Set up company-specific network configurations
5. **Calculate Range**: Get the complete network range information including:
   - Network address
   - Broadcast address
   - First and last usable IP addresses
   - Total number of hosts

## 📁 Project Structure

```
itmanagement/
├── src/
│   └── app/              # Next.js App Router directory
│       ├── layout.tsx    # Root layout
│       ├── page.tsx      # Main calculator page
│       └── globals.css   # Global styles
├── public/               # Static files
├── server.tsx           # Custom server (for IIS deployment)
├── web.config           # IIS configuration file
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

## 🚀 Deployment

### IIS Deployment

This project is configured for deployment on Windows IIS servers.

1. Create production build:
   ```bash
   npm run build
   ```

2. The `web.config` file is configured to properly run the Next.js application on IIS.

3. Deploy application to IIS:
   - Copy built files to IIS web server directory
   - Node.js and iisnode module must be installed
   - `server.tsx` is used as the entry point

### Environment Variables

You can create a `.env.local` file to set environment variables if needed:

```env
PORT=3000
NODE_ENV=production
```

## 🎨 Styling

This project uses Tailwind CSS for styling. You can customize the theme and configuration in `tailwind.config.ts`.

## 📝 Development Guidelines

- Create pages in the `src/app/` directory
- It's recommended to organize reusable components in a `src/components/` directory
- TypeScript is used to ensure type safety
- IP calculation logic should follow standard networking protocols
- Ensure validation for IP addresses and subnet masks
- Support for CIDR notation (e.g., 192.168.1.0/24)

## 🌐 IP Address Classes

- **Class A**: 1.0.0.0 to 126.255.255.255 (Default mask: 255.0.0.0 or /8)
- **Class B**: 128.0.0.0 to 191.255.255.255 (Default mask: 255.255.0.0 or /16)
- **Class C**: 192.0.0.0 to 223.255.255.255 (Default mask: 255.255.255.0 or /24)

## 📄 License

This project is private.

## 👥 Contributing

Please open an issue for suggestions or bug reports to improve the project.
