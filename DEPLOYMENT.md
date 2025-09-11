# 🚀 Azure Deployment Guide

This guide covers deployment of the UN Jobs Analytics Dashboard to Azure.

## 📋 Prerequisites

- Azure subscription
- GitHub repository (for automated deployments)
- Node.js 18+ locally for testing

## 🎯 Deployment Options

### Option 1: Azure Static Web Apps (Recommended)

Azure Static Web Apps provides the best experience for React applications with automatic CI/CD.

#### Setup Steps:

1. **Create Azure Static Web App:**
   ```bash
   # Using Azure CLI
   az staticwebapp create \
     --name "un-jobs-analytics" \
     --resource-group "your-resource-group" \
     --source "https://github.com/yourusername/your-repo" \
     --location "East US 2" \
     --branch "main" \
     --app-location "/" \
     --output-location "build"
   ```

2. **Configure GitHub Actions:**
   - The workflow file is already created at `.github/workflows/azure-static-web-apps.yml`
   - Add the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret to your GitHub repository
   - Get the token from Azure Portal → Static Web App → Manage deployment token

3. **Automatic Deployment:**
   - Push to main/master branch triggers deployment
   - Pull requests create preview environments

#### Configuration Files:
- ✅ `staticwebapp.config.json` - Routing and security headers
- ✅ `.github/workflows/azure-static-web-apps.yml` - CI/CD pipeline

### Option 2: Azure App Service

For more control over the hosting environment.

#### Setup Steps:

1. **Create App Service:**
   ```bash
   # Create resource group
   az group create --name un-jobs-rg --location "East US"
   
   # Create App Service plan
   az appservice plan create \
     --name un-jobs-plan \
     --resource-group un-jobs-rg \
     --sku FREE \
     --is-linux
   
   # Create web app
   az webapp create \
     --name un-jobs-analytics \
     --resource-group un-jobs-rg \
     --plan un-jobs-plan \
     --runtime "NODE|18-lts"
   ```

2. **Deploy using GitHub Actions or Local Git:**
   ```bash
   # Build locally and deploy
   npm run build:azure
   
   # Deploy to Azure (after configuring deployment credentials)
   az webapp deployment source config-zip \
     --resource-group un-jobs-rg \
     --name un-jobs-analytics \
     --src build.zip
   ```

#### Configuration Files:
- ✅ `web.config` - IIS rewrite rules and security headers
- ✅ `deploy.cmd` - Custom deployment script
- ✅ `.deployment` - Deployment configuration

## 🔧 Production Build

### Build Commands:
```bash
# Standard build
npm run build

# Azure App Service build (includes web.config)
npm run build:azure

# Test production build locally
npm run serve
```

### Build Optimizations:
- ✅ Tree shaking and minification
- ✅ Code splitting
- ✅ Asset optimization
- ✅ Source maps disabled in production
- ✅ Gzip compression enabled

## 🔒 Security Features

### Implemented Security Headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` for camera/microphone restrictions

### File Security:
- ✅ Static asset handling
- ✅ MIME type configuration
- ✅ CSV file support
- ✅ Font file handling

## 🌐 Domain and SSL

### Custom Domain (Azure Static Web Apps):
1. Go to Azure Portal → Static Web App → Custom domains
2. Add your domain (e.g., `analytics.un.org`)
3. Configure DNS CNAME record
4. SSL certificate is automatically provided

### Custom Domain (App Service):
1. Go to Azure Portal → App Service → Custom domains
2. Add domain and configure DNS
3. Enable SSL certificate (free managed certificate available)

## 📊 Monitoring and Performance

### Application Insights:
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app un-jobs-analytics \
  --location eastus \
  --resource-group un-jobs-rg
```

### Performance Optimizations:
- ✅ Lazy loading of components
- ✅ Data memoization
- ✅ Efficient chart rendering
- ✅ Image optimization
- ✅ CDN for static assets

## 🚀 Deployment Checklist

### Pre-deployment:
- [ ] Run `npm run build` successfully
- [ ] Test production build locally with `npm run serve`
- [ ] Verify all assets load correctly
- [ ] Check CSV data loading
- [ ] Test agency logos display
- [ ] Verify responsive design

### Post-deployment:
- [ ] Verify application loads correctly
- [ ] Test data processing with sample data
- [ ] Check all dashboard tabs function
- [ ] Verify filtering and interactions work
- [ ] Test on mobile devices
- [ ] Check performance with Azure Application Insights

## 📈 Performance Monitoring

### Key Metrics to Monitor:
- Page load time
- Bundle size
- CSV processing time
- Memory usage
- User interactions

### Recommended Tools:
- Azure Application Insights
- Lighthouse performance audits
- Web Vitals monitoring
- Real User Monitoring (RUM)

## 🔄 CI/CD Pipeline

### Automated Testing:
```yaml
# Add to GitHub workflow
- name: Run tests
  run: npm test -- --coverage --watchAll=false

- name: Run linting
  run: npm run lint

- name: Security audit
  run: npm audit --audit-level moderate
```

### Environment Variables:
- Production builds automatically disable source maps
- Version information injected during build
- Build date tracking for deployment verification

## 📝 Troubleshooting

### Common Issues:

1. **Routing Issues:**
   - Ensure `web.config` or `staticwebapp.config.json` handles SPA routing
   - Check rewrite rules for static assets

2. **CSV Loading Issues:**
   - Verify CSV files are in `/public` directory
   - Check MIME type configuration
   - Ensure proper CORS headers

3. **Asset Loading:**
   - Confirm `homepage: "."` in `package.json`
   - Check relative paths in asset references

4. **Performance Issues:**
   - Enable compression in Azure
   - Configure CDN for static assets
   - Monitor bundle size

## 🆘 Support

For deployment support:
1. Check Azure Activity Log for deployment errors
2. Review Application Insights for runtime issues
3. Monitor GitHub Actions for CI/CD pipeline status
4. Check browser developer tools for client-side errors

---

**Ready for Production!** 🎉

Your UN Jobs Analytics Dashboard is now configured for secure, scalable deployment on Azure.
