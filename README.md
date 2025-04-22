## Description
request performance test
## Installation

### Prerequisites
- Node.js (v16 or later recommended)
- npm
- Docker and Docker Compose (for containerized deployment)

### Setup
Clone the repository and install dependencies:

```bash
git clone https://github.com/hamdizer/performance-api-test.git
cd your-repo
npm install
```

## Steps to Run the Project
### In Development:
Open **two terminals**:
1. First terminal:
    ```bash
    npm start
    ```
2. Second terminal:
    ```bash
    npm run stress-test
    ```
npm start process must be executed before npm run stress-test process

### Using Docker:
```bash
docker-compose up --build
```
