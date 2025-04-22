## Description
Caculator
## Installation

### Prerequisites
- Node.js (v16 or later recommended)
- npm
- Docker and Docker Compose (for containerized deployment)

### Setup
Clone the repository and install dependencies:

\`\`\`bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
npm install
\`\`\`

## Usage

### In Development:
Run the development server with hot-reload:

\`\`\`bash
npm run dev
\`\`\`
The application will be available at http://localhost:3000

### Using Docker:
Build the application and start the Docker container:

\`\`\`bash
npm run build
docker-compose up --build
\`\`\`
The application will be available at http://localhost:3000

## Project Structure
\`\`\`
├── components/     # React components
├── pages/          # Next.js pages
├── public/         # Static assets
├── styles/         # CSS/SCSS files
├── Dockerfile      # Docker configuration
└── docker-compose.yml # Docker Compose configuration
\`\`\`
