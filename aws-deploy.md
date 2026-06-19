# AeroCast AWS Deployment

## Environment Variables (must set in AWS)

| Variable | Required | Where to get |
|---|---|---|
| `NEXT_PUBLIC_WEATHER_API_KEY` | Yes | https://openweathermap.org/api |
| `NEXT_PUBLIC_GROQ_API_KEY` | No (chatbot falls back to basic replies) | https://console.groq.com |

> `NEXT_PUBLIC_` prefix makes the key available to browser code — OpenWeather keys are client-safe.

---

## Option 1: AWS Amplify (easiest for Next.js)

1. Push repo to GitHub
2. Go to **AWS Amplify Console** → **Create new app** → **Host web app**
3. Connect your GitHub repo
4. **Build settings** (Amplify auto-detects Next.js):
   - **Build command:** `npm run build`
   - **Output directory:** `.next`
5. **Advanced → Environment variables:** Add both keys above
6. Deploy — Amplify handles SSR, ISR, and all Next.js features automatically.

---

## Option 2: Docker + ECS/Elastic Beanstalk

### Dockerfile
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Build & push to ECR
```bash
aws ecr create-repository --repository-name aerocast
docker build -t aerocast .
docker tag aerocast:latest <account>.dkr.ecr.<region>.amazonaws.com/aerocast:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/aerocast:latest
```

### Elastic Beanstalk
```bash
# Install EB CLI, then:
eb init -p docker aerocast
eb create aerocast-env
eb setenv NEXT_PUBLIC_WEATHER_API_KEY=xxx NEXT_PUBLIC_GROQ_API_KEY=xxx
eb open
```

### ECS Fargate
- Create **task definition** using the ECR image, port 3000
- Set **environment variables** in the task definition
- Create **ECS service** with Application Load Balancer (port 80 → 3000)

---

## Option 3: EC2 (manual)

```bash
ssh -i key.pem ec2-user@<ip>
sudo yum install -y nodejs20 git
git clone https://github.com/your/repo.git
cd aerocast-web
npm ci
echo "NEXT_PUBLIC_WEATHER_API_KEY=xxx" >> .env
echo "NEXT_PUBLIC_GROQ_API_KEY=xxx" >> .env
npm run build
npm start
```

Use `pm2` for process management:
```bash
npm i -g pm2
pm2 start npm --name aerocast -- start
pm2 save
```

---

## Verify deployment

```bash
curl https://your-domain.com/api/health
# → {"status":"healthy","service":"AeroCast Weather Intelligence","version":"1.0.0"}
```

Test city search:
```bash
curl "https://your-domain.com/api/weather/geocode?q=paris"
# → should return Paris, FR matches
```
