# Docker Production Deployment Guide

This guide covers deploying your Node.js Express TypeORM application to production using Docker.

## 🚀 Quick Start

### Build and Run
```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run
```

### Manual Docker Commands
```bash
# Build image
docker build -t node-express-typeorm-api .

# Run container with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-db-password \
  node-express-typeorm-api
```

## 🔧 Environment Variables

### Required for Production
```bash
NODE_ENV=production
DB_HOST=your-database-host
DB_USER=your-database-user  
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
```

### Optional
```bash
PORT=3000                    # Default: 3000
DB_PORT=5432                # Default: 5432
```

## 🏗️ Production Deployment Options

### 1. AWS ECS (Elastic Container Service)

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag node-express-typeorm-api:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/node-express-typeorm-api:latest

# Push image
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/node-express-typeorm-api:latest
```

**ECS Task Definition Example:**
```json
{
  "family": "node-express-typeorm-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/node-express-typeorm-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {"name": "DB_HOST", "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-host"},
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-password"}
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/node-express-typeorm-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 2. Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/node-express-typeorm-api

# Deploy to Cloud Run
gcloud run deploy node-express-typeorm-api \
  --image gcr.io/YOUR_PROJECT_ID/node-express-typeorm-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars DB_HOST=YOUR_DB_HOST
```

### 3. Kubernetes

**Deployment YAML:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-express-typeorm-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: node-express-typeorm-api
  template:
    metadata:
      labels:
        app: node-express-typeorm-api
    spec:
      containers:
      - name: app
        image: node-express-typeorm-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 4. Digital Ocean App Platform

**app.yaml:**
```yaml
name: node-express-typeorm-api
services:
- name: api
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DB_HOST
    value: ${db.HOSTNAME}
  - key: DB_PASSWORD
    value: ${db.PASSWORD}
  http_port: 3000
  health_check:
    http_path: /api/health
databases:
- engine: PG
  name: db
  num_nodes: 1
  size: db-s-dev-database
  version: "13"
```

## 🔒 Security Best Practices

### 1. Environment Variables
- Never hardcode secrets in Dockerfile
- Use secret management services (AWS Secrets Manager, etc.)
- Rotate database credentials regularly

### 2. Container Security
- Non-root user (✅ implemented)
- Minimal base image (Alpine Linux)
- Regular security updates
- Scan images for vulnerabilities

### 3. Database Security
- Use SSL connections in production (✅ implemented)
- Network isolation (VPC)
- Regular backups
- Connection pooling (✅ implemented)

## 📊 Monitoring & Logging

### Health Checks
```bash
# Container health check
curl http://localhost:3000/api/health

# Expected response
{"success":true,"message":"API is healthy","timestamp":"2024-12-07T10:30:00.000Z"}
```

### Logging
- Application logs to stdout/stderr
- Use centralized logging (ELK, CloudWatch, etc.)
- Log rotation and retention policies

### Metrics
- Resource usage (CPU, Memory)
- Response times
- Error rates
- Database connection pool status

## 🚀 CI/CD Pipeline Example

**GitHub Actions (.github/workflows/deploy.yml):**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: docker build -t node-express-typeorm-api .
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Login to Amazon ECR
      run: aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
    
    - name: Push to ECR
      run: |
        docker tag node-express-typeorm-api:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/node-express-typeorm-api:latest
        docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/node-express-typeorm-api:latest
    
    - name: Update ECS service
      run: |
        aws ecs update-service --cluster production --service node-express-typeorm-api --force-new-deployment
```

## 🔧 Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check environment variables
docker run --rm node-express-typeorm-api env | grep DB_

# Test database connectivity
docker run --rm -it node-express-typeorm-api sh
```

**Health Check Failing:**
```bash
# Check application logs
docker logs container_id

# Test health endpoint
curl -f http://localhost:3000/api/health
```

**Memory Issues:**
```bash
# Monitor resource usage
docker stats container_id

# Increase memory limits
docker run -m 512m node-express-typeorm-api
```

## 📋 Production Checklist

- [ ] Environment variables configured
- [ ] Database SSL enabled
- [ ] Health checks working
- [ ] Resource limits set
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Backup strategy in place
- [ ] Security scan passed
- [ ] Load testing completed
- [ ] Rollback plan documented

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review resource usage
5. Check health endpoint status

The application is production-ready with proper error handling, graceful shutdown, and health checks implemented.