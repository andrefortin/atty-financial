# SSL Certificates and DNS Configuration

This guide covers SSL certificate setup and DNS configuration for ATTY Financial's production environment.

## Table of Contents

- [Overview](#overview)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Firebase Hosting SSL](#firebase-hosting-ssl)
- [Custom Domain Configuration](#custom-domain-configuration)
- [DNS Configuration](#dns-configuration)
- [Subdomain Configuration](#subdomain-configuration)
- [DNS Propagation Verification](#dns-propagation-verification)
- [SSL Certificate Renewal](#ssl-certificate-renewal)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Monitoring](#monitoring)

---

## Overview

ATTY Financial uses Firebase Hosting for SSL certificate management and domain hosting.

### Key Features

- **Automatic SSL**: Firebase Hosting provides free, automatic SSL certificates
- **Global CDN**: Content delivered via Firebase's global CDN
- **DNS Management**: Full DNS configuration through Firebase Console
- **SSL Renewal**: Automatic certificate renewal
- **Security**: Modern encryption and security headers

### Domain Structure

| Domain | Purpose | SSL |
|---------|---------|------|
| `attyfinancial.com` | Main production site | Automatic |
| `www.attyfinancial.com` | WWW redirect | Automatic |
| `staging.attyfinancial.com` | Staging environment | Automatic |
| `app.attyfinancial.com` | Application (optional) | Automatic |
| `api.attyfinancial.com` | API (external) | Manual |

---

## SSL Certificate Setup

### Firebase Hosting Automatic SSL

Firebase Hosting provides **free, automatic SSL certificates** for all custom domains.

#### How It Works

1. **Automatic Provisioning**: Firebase automatically provisions SSL certificates via Let's Encrypt
2. **Automatic Renewal**: Certificates are automatically renewed before expiration
3. **Global CDN**: Certificates are distributed globally via Firebase CDN
4. **No Cost**: SSL certificates are completely free

#### Supported Certificate Types

- **Domain Validation (DV)**: Default for all custom domains
- **Organization Validation (OV)**: Not supported by Firebase
- **Extended Validation (EV)**: Not supported by Firebase

#### Certificate Details

| Property | Value |
|----------|--------|
| **Certificate Authority** | Let's Encrypt (via Google) |
| **Certificate Type** | Domain Validation (DV) |
| **Encryption** | TLS 1.2, TLS 1.3 |
| **Cipher Suites** | Modern, secure ciphers |
| **Certificate Lifetime** | 90 days (auto-renewed) |
| **Renewal Window** | 30 days before expiration |
| **Cost** | Free |

### Manual SSL Certificates (Not Recommended)

Firebase Hosting does not support manual SSL certificates. If you need custom SSL:

1. **Use Cloudflare**: Set Cloudflare as DNS proxy
2. **Use Cloud Load Balancer**: Google Cloud Platform solution
3. **Use CloudFront**: AWS solution

**Note**: These solutions add complexity and cost. Firebase's automatic SSL is recommended.

---

## Firebase Hosting SSL

### Verify SSL Status

Check SSL certificate status in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `atty-financial-production`
3. Navigate to: Hosting → Domains
4. Check status column:
   - 🟢 **Active**: SSL certificate is active
   - 🟡 **Provisioning**: SSL certificate is being provisioned
   - 🔴 **Failed**: SSL certificate provisioning failed

### SSL Certificate Information

View certificate details:

```bash
# Using OpenSSL
openssl s_client -showcerts -connect attyfinancial.com:443

# Using curl
curl -vI https://attyfinancial.com 2>&1 | grep -i "ssl certificate"

# Using browser
# Visit https://attyfinancial.com
# Click lock icon → Certificate is valid → View certificate
```

### SSL Certificate Chain

Firebase provides a complete certificate chain:

```
attyfinancial.com (Leaf Certificate)
  └─ Let's Encrypt Authority X3 (Intermediate)
      └─ DST Root CA X3 (Root)
```

### HSTS Configuration

Firebase Hosting supports HTTP Strict Transport Security (HSTS):

```json
{
  "headers": [
    {
      "source": "**",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

Add to `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains; preload"
          }
        ]
      }
    ],
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Custom Domain Configuration

### Add Custom Domain

1. Go to Firebase Console → Hosting → Domains
2. Click "Add custom domain"
3. Enter domain: `attyfinancial.com`
4. Select default domain for redirect:
   - `atty-financial-production.web.app`
5. Click "Continue"
6. Firebase will provide DNS records to add

### Verify Domain Ownership

Firebase offers two verification methods:

#### Method 1: DNS Record (Recommended)

Add TXT record to verify ownership:

```
Type: TXT
Name: @
Value: firebase=your-verification-token
```

#### Method 2: HTML File Upload

Upload verification file to your domain:

1. Firebase provides HTML file
2. Upload to: `https://attyfinancial.com/.well-known/pki-validation/verification.html`
3. Firebase verifies file exists

**Note**: DNS verification is recommended for security and simplicity.

### Domain Types

#### Apex Domain

```
Domain: attyfinancial.com
Type: Apex (no subdomain)
DNS: A records (not CNAME)
```

#### Subdomain

```
Domain: www.attyfinancial.com
Type: Subdomain
DNS: CNAME record
```

#### Wildcard Subdomain

```
Domain: *.attyfinancial.com
Type: Wildcard
DNS: CNAME record
Note: Not supported by Firebase Hosting
```

---

## DNS Configuration

### Required DNS Records

#### For Apex Domain: `attyfinancial.com`

| Type | Name | Value | TTL |
|------|------|-------|------|
| A | @ | 199.36.158.100 | 3600 |
| A | @ | 199.36.158.101 | 3600 |
| A | @ | 199.36.158.102 | 3600 |
| A | @ | 199.36.158.103 | 3600 |
| TXT | @ | `v=spf1 include:_spf.google.com ~all` | 3600 |

#### For WWW Subdomain: `www.attyfinancial.com`

| Type | Name | Value | TTL |
|------|------|-------|------|
| CNAME | www | atty-financial-production.web.app. | 3600 |

#### For Staging Subdomain: `staging.attyfinancial.com`

| Type | Name | Value | TTL |
|------|------|-------|------|
| CNAME | staging | atty-financial-staging.web.app. | 3600 |

### Complete DNS Configuration

#### Production DNS Records

```
; attyfinancial.com - Production

; Apex domain (attyfinancial.com)
@                        A      3600    199.36.158.100
@                        A      3600    199.36.158.101
@                        A      3600    199.36.158.102
@                        A      3600    199.36.158.103
@                        TXT    3600    "v=spf1 include:_spf.google.com ~all"
@                        TXT    3600    "firebase=your-verification-token"
@                        MX     3600    10 alt1.aspmx.l.google.com.
@                        MX     3600    20 alt2.aspmx.l.google.com.

; WWW subdomain
www                      CNAME  3600    atty-financial-production.web.app.

; Staging subdomain
staging                   CNAME  3600    atty-financial-staging.web.app.

; App subdomain (optional)
app                       CNAME  3600    atty-financial-production.web.app.

; API subdomain (external)
api                       CNAME  3600    your-api-server.com.

; SPF record for email
@                        TXT    3600    "v=spf1 include:_spf.google.com ~all"

; DMARC record
_dmarc                    TXT    3600    "v=DMARC1; p=none; rua=mailto:dmarc@attyfinancial.com"

; DKIM (if using custom email)
selector1._domainkey      TXT    3600    "your-dkim-record"

; Google Workspace (Gmail)
@                        TXT    3600    "google-site-verification=your-verification-code"
```

#### Staging DNS Records

```
; staging.attyfinancial.com - Staging Environment

; Staging subdomain
staging                   CNAME  3600    atty-financial-staging.web.app.

; Google Workspace (shared)
@                        TXT    3600    "google-site-verification=your-verification-code"
```

### DNS Provider Configuration

#### GoDaddy

1. Login to GoDaddy
2. Navigate to: My Products → DNS Management
3. Select domain: `attyfinancial.com`
4. Add records as shown in DNS Configuration section

#### Namecheap

1. Login to Namecheap
2. Navigate to: Domain List → Manage
3. Click: Advanced DNS
4. Add records as shown in DNS Configuration section

#### Cloudflare

1. Login to Cloudflare
2. Select domain: `attyfinancial.com`
3. Navigate to: DNS → Records
4. Add records as shown in DNS Configuration section

**Note**: If using Cloudflare, configure proxy settings:
- Enable "Proxied" (orange cloud icon) for subdomains
- Disable "DNS only" (grey cloud icon) for apex domain (not supported)

#### Google Domains

1. Login to Google Domains
2. Select domain: `attyfinancial.com`
3. Navigate to: DNS → DNS Settings
4. Add records as shown in DNS Configuration section

### Firebase Hosting IP Addresses

Firebase Hosting provides multiple IP addresses for redundancy:

| IP Address | Location |
|-------------|----------|
| 199.36.158.100 | Global |
| 199.36.158.101 | Global |
| 199.36.158.102 | Global |
| 199.36.158.103 | Global |

**Important**: Always configure all 4 IP addresses for redundancy.

---

## Subdomain Configuration

### WWW Subdomain

Configure `www.attyfinancial.com`:

```
Type: CNAME
Name: www
Value: atty-financial-production.web.app.
TTL: 3600 (1 hour)
```

Purpose: Redirect users who type `www.attyfinancial.com`

### Staging Subdomain

Configure `staging.attyfinancial.com`:

```
Type: CNAME
Name: staging
Value: atty-financial-staging.web.app.
TTL: 3600 (1 hour)
```

Purpose: Staging environment for testing

### App Subdomain (Optional)

Configure `app.attyfinancial.com`:

```
Type: CNAME
Name: app
Value: atty-financial-production.web.app.
TTL: 3600 (1 hour)
```

Purpose: Application subdomain (if using custom app domain)

### API Subdomain (External)

Configure `api.attyfinancial.com`:

```
Type: CNAME
Name: api
Value: your-api-server.com.
TTL: 3600 (1 hour)
```

Purpose: API endpoint (external to Firebase)

### Email Subdomains

Configure email-related subdomains:

```
; SPF for email
@                        TXT    3600    "v=spf1 include:_spf.google.com ~all"

; DMARC
_dmarc                    TXT    3600    "v=DMARC1; p=none; rua=mailto:dmarc@attyfinancial.com"

; DKIM (if using)
selector1._domainkey      TXT    3600    "your-dkim-record"
```

---

## DNS Propagation Verification

### Check DNS Propagation

Use online tools to verify DNS propagation:

#### 1. DNS Checker Tools

- [DNS Checker](https://dnschecker.org/) - Check DNS from multiple locations
- [WhatsMyDNS](https://www.whatsmydns.net/) - Check DNS propagation
- [DNS Propagation Checker](https://www.whatsmydns.net/) - Check global propagation
- [MXToolbox](https://mxtoolbox.com/DNSLookup.aspx) - Comprehensive DNS lookup

#### 2. Command Line Tools

```bash
# Check A records
dig attyfinancial.com A +short
nslookup attyfinancial.com
host attyfinancial.com

# Check CNAME records
dig www.attyfinancial.com CNAME +short
dig staging.attyfinancial.com CNAME +short

# Check TXT records
dig attyfinancial.com TXT +short

# Check MX records
dig attyfinancial.com MX +short

# Check SOA record
dig attyfinancial.com SOA +short

# Check from specific DNS server
dig @8.8.8.8 attyfinancial.com A +short
dig @1.1.1.1 attyfinancial.com A +short

# Check authoritative NS records
dig attyfinancial.com NS +short
```

#### 3. Propagation Time

DNS propagation typically takes:

| Location | Typical Time | Max Time |
|-----------|---------------|-----------|
| United States | 5-60 minutes | 4 hours |
| Europe | 5-60 minutes | 4 hours |
| Asia | 30-120 minutes | 12 hours |
| Australia | 30-120 minutes | 12 hours |
| Global | 30-120 minutes | 24-48 hours |

### Verify SSL Certificate

Check SSL certificate status:

```bash
# Check SSL certificate
openssl s_client -showcerts -connect attyfinancial.com:443

# Check SSL from multiple locations
for host in 8.8.8.8 1.1.1.1; do
  dig @${host} attyfinancial.com A +short
done

# Check SSL with curl
curl -vI https://attyfinancial.com 2>&1 | grep -i "ssl"

# Check SSL with online tools
# - SSL Labs: https://www.ssllabs.com/ssltest/
# - SSL Checker: https://www.sslshopper.com/ssl-checker/
```

### Verify Domain is Active

Verify domain is properly configured:

```bash
# Check domain resolves correctly
curl -I https://attyfinancial.com

# Check HTTP redirect
curl -I http://attyfinancial.com

# Check SSL certificate
curl -I https://www.attyfinancial.com

# Check staging subdomain
curl -I https://staging.attyfinancial.com

# Check response headers
curl -I https://attyfinancial.com | grep -i "server"

# Check SSL certificate details
curl -vI https://attyfinancial.com 2>&1 | grep -A 20 "SSL certificate"
```

### Verify Firebase Hosting Status

Check Firebase Console for domain status:

1. Go to Firebase Console → Hosting → Domains
2. Check each domain's status:
   - 🟢 **Active**: Domain is active and SSL is provisioned
   - 🟡 **Provisioning**: SSL is being provisioned
   - 🔴 **Failed**: Provisioning failed (check DNS records)

### Firebase CLI Verification

Use Firebase CLI to verify domain status:

```bash
# List domains
firebase hosting:sites:list

# Get domain status
firebase hosting:sites:get atty-financial-production

# Check channel status
firebase hosting:channel:list

# Check release status
firebase hosting:releases:list
```

---

## SSL Certificate Renewal

### Automatic Renewal

Firebase Hosting automatically renews SSL certificates:

- **Renewal Window**: 30 days before expiration
- **Certificate Lifetime**: 90 days
- **Process**: Fully automatic
- **Notification**: Firebase sends email if renewal fails

### Monitor Certificate Expiration

Monitor SSL certificate expiration:

```bash
# Check certificate expiration
echo | openssl s_client -showcerts -connect attyfinancial.com:443 2>&1 | \
  grep "notAfter=" | \
  sed 's/.*notAfter=\([^)]*\).*/\1/'

# Calculate days until expiration
date -d "$(openssl s_client -showcerts -connect attyfinancial.com:443 2>&1 | \
  grep 'notAfter=' | \
  sed 's/.*notAfter=\([^)]*\).*/\1/')" +%s

# Monitor with cron job (Linux)
# Add to crontab:
0 0 * * * /path/to/check-ssl.sh
```

### Monitor SSL Certificate Health

Use online tools to monitor SSL health:

- [SSL Labs](https://www.ssllabs.com/ssltest/analyze.html?d=attyfinancial.com)
- [SSL Checker](https://www.sslshopper.com/ssl-checker/attyfinancial.com)
- [SSL Checker by Qualys](https://www.ssllabs.com/ssltest/)
- [Hardenize](https://www.hardenize.com/quickscan/attyfinancial.com)

### Certificate Renewal Failures

If automatic renewal fails:

1. **Check DNS Records**:
   - Verify A records are correct
   - Verify CNAME records are correct
   - Check TTL settings

2. **Check Domain Status**:
   - Verify domain is not expired
   - Verify domain is not suspended
   - Verify DNSSEC settings

3. **Check Firebase Console**:
   - Check for error messages
   - Check provisioning status
   - Review domain settings

4. **Contact Support**:
   - Firebase Support
   - Let's Encrypt (via Firebase)

---

## Troubleshooting

### Domain Not Resolving

**Symptoms**:
- `attyfinancial.com` doesn't resolve
- DNS query returns NXDOMAIN
- "This site can't be reached"

**Solutions**:

1. **Check DNS Records**:
   ```bash
   dig attyfinancial.com
   nslookup attyfinancial.com
   ```

2. **Verify IP Addresses**:
   ```bash
   dig attyfinancial.com A +short
   # Should return: 199.36.158.100-103
   ```

3. **Check DNS Propagation**:
   - Use DNS checker tools
   - Wait for propagation (up to 48 hours)
   - Check from different DNS servers

4. **Verify Domain Status**:
   - Check domain is not expired
   - Check domain is not suspended
   - Verify WHOIS information

5. **Clear DNS Cache**:
   ```bash
   # Clear local DNS cache (Linux)
   sudo systemctl flush-dns

   # Clear DNS cache (macOS)
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder

   # Clear DNS cache (Windows)
   ipconfig /flushdns
   ```

### SSL Certificate Not Loading

**Symptoms**:
- "Your connection is not private" error
- "SSL certificate invalid" error
- Warning in browser address bar

**Solutions**:

1. **Check SSL Status**:
   ```bash
   openssl s_client -showcerts -connect attyfinancial.com:443
   ```

2. **Check Certificate Chain**:
   ```bash
   openssl s_client -showcerts -connect attyfinancial.com:443 2>&1 | \
     grep -A 5 "Certificate chain"
   ```

3. **Check Certificate Expiration**:
   ```bash
   curl -vI https://attyfinancial.com 2>&1 | grep -i "expire"
   ```

4. **Check Firebase Console**:
   - Check SSL status in Hosting → Domains
   - Look for error messages
   - Check if SSL is provisioning

5. **Wait for SSL Provisioning**:
   - SSL provisioning can take 30-60 minutes
   - Check status in Firebase Console
   - Wait for "Active" status

### Mixed Content Warnings

**Symptoms**:
- "Mixed content" warning in console
- Some resources load over HTTP
- Browser blocks some resources

**Solutions**:

1. **Update Resource URLs**:
   ```html
   <!-- Wrong -->
   <img src="http://attyfinancial.com/image.jpg">

   <!-- Correct -->
   <img src="https://attyfinancial.com/image.jpg">
   ```

2. **Use Relative URLs**:
   ```html
   <!-- Correct -->
   <img src="/images/image.jpg">
   ```

3. **Update Firebase.json**:
   ```json
   {
     "hosting": {
       "headers": [
         {
           "source": "**",
           "headers": [
             {
               "key": "Content-Security-Policy",
               "value": "upgrade-insecure-requests"
             }
           ]
         }
       ]
     }
   }
   ```

### HSTS Errors

**Symptoms**:
- Cannot access domain after HSTS preload
- Browser blocks domain
- "Strict-Transport-Security" errors

**Solutions**:

1. **Remove HSTS Preload**:
   - Remove from HSTS preload list
   - Submit removal request: https://hstspreload.org/
   - Wait for browser cache to expire

2. **Clear HSTS State**:
   - Chrome: Settings → Privacy → Security → Clear browsing data → "Cached images and files"
   - Firefox: Preferences → Privacy & Security → Cookies and Site Data → Clear Data

3. **Reduce HSTS Duration**:
   ```json
   {
     "headers": [
       {
         "source": "**",
         "headers": [
           {
             "key": "Strict-Transport-Security",
             "value": "max-age=86400" // 1 day instead of 1 year
           }
         ]
       }
     ]
   }
   ```

### DNSSEC Errors

**Symptoms**:
- DNSSEC validation fails
- "DNSSEC bogus" errors
- Domain not resolving

**Solutions**:

1. **Disable DNSSEC**:
   - Remove DS records from DNS
   - Wait for propagation
   - Verify DNS resolution

2. **Check DNSSEC Configuration**:
   ```bash
   dig +dnssec attyfinancial.com DNSKEY
   delv attyfinancial.com
   ```

3. **Contact DNS Provider**:
   - Verify DNSSEC configuration
   - Check DS records
   - Update if necessary

### Cloudflare Configuration Issues

**Symptoms**:
- 522 errors (Connection timed out)
- 525 errors (SSL handshake failed)
- DNS resolution issues

**Solutions**:

1. **Check Cloudflare DNS Mode**:
   - Verify "Proxied" (orange cloud) for subdomains
   - Verify "DNS Only" (grey cloud) is not used (not supported)
   - Check IP addresses match Firebase

2. **Check Cloudflare SSL Mode**:
   - Set SSL mode to "Full" (not "Flexible")
   - "Full" allows end-to-end encryption
   - "Flexible" breaks encryption

3. **Check Cloudflare Page Rules**:
   - Remove page rules that might interfere
   - Verify forwarding rules are correct
   - Check caching rules

4. **Check Cloudflare Firewall**:
   - Verify no blocking rules
   - Check rate limiting settings
   - Verify IP whitelist

---

## Security Best Practices

### DNS Security

1. **Use DNSSEC**:
   - Enable DNSSEC for domain
   - Add DS records to DNS
   - Verify DNSSEC validation

2. **Use SPF**:
   ```
   @  TXT  3600  "v=spf1 include:_spf.google.com ~all"
   ```

3. **Use DMARC**:
   ```
   _dmarc  TXT  3600  "v=DMARC1; p=none; rua=mailto:dmarc@attyfinancial.com"
   ```

4. **Use DKIM**:
   ```
   selector1._domainkey  TXT  3600  "your-dkim-record"
   ```

5. **Lock DNS Zone**:
   - Enable DNS lock at registrar
   - Prevent unauthorized changes
   - Require multi-factor auth

### SSL Security

1. **Enable HSTS**:
   ```json
   {
     "headers": [
       {
         "source": "**",
         "headers": [
           {
             "key": "Strict-Transport-Security",
             "value": "max-age=31536000; includeSubDomains; preload"
           }
         ]
       }
     ]
   }
   ```

2. **Use Modern Cipher Suites**:
   - Firebase uses modern cipher suites automatically
   - TLS 1.2 and TLS 1.3 only
   - TLS 1.0 and TLS 1.1 disabled

3. **Enable Perfect Forward Secrecy**:
   - Firebase uses PFS automatically
   - Key rotation every 90 days
   - Secure key management

4. **Monitor Certificate Health**:
   - Use SSL Labs to monitor
   - Set up alerts for expiration
   - Regular certificate audits

### Firebase Security

1. **Enable Security Headers**:
   ```json
   {
     "hosting": {
       "headers": [
         {
           "source": "**",
           "headers": [
             {
               "key": "X-Content-Type-Options",
               "value": "nosniff"
             },
             {
               "key": "X-Frame-Options",
               "value": "DENY"
             },
             {
               "key": "X-XSS-Protection",
               "value": "1; mode=block"
             },
             {
               "key": "Referrer-Policy",
               "value": "strict-origin-when-cross-origin"
             },
             {
               "key": "Permissions-Policy",
               "value": "geolocation=(), microphone=(), camera=()"
             }
           ]
         }
       ]
     }
   }
   ```

2. **Enable Content Security Policy**:
   ```json
   {
     "headers": [
       {
         "source": "**",
         "headers": [
           {
             "key": "Content-Security-Policy",
             "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.attfinancial.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
           }
         ]
       }
     ]
   }
   ```

---

## Monitoring

### DNS Monitoring

Monitor DNS health:

1. **Use Uptime Monitoring**:
   - Set up uptime monitoring for domain
   - Monitor DNS resolution
   - Monitor SSL certificate
   - Set up alerts

2. **Use DNS Monitoring Services**:
   - [DNS Spy](https://dnsspy.io/)
   - [DNSPerf](https://dnsperf.com/)
   - [DNSstuff](https://www.dnsstuff.com/)

3. **Monitor DNS Propagation**:
   ```bash
   # Script to check DNS from multiple servers
   for server in 8.8.8.8 1.1.1.1 208.67.222.222; do
     echo "Checking from ${server}..."
     dig @${server} attyfinancial.com A +short
   done
   ```

### SSL Monitoring

Monitor SSL certificate health:

1. **Use SSL Monitoring Services**:
   - [SSL Labs Monitor](https://www.ssllabs.com/monitor.html)
   - [UptimeRobot SSL](https://uptimerobot.com/ssl-monitor)
   - [StatusCake SSL](https://www.statuscake.com/)

2. **Monitor Certificate Expiration**:
   ```bash
   # Script to check SSL expiration
   expiration=$(echo | openssl s_client -showcerts -connect attyfinancial.com:443 2>&1 | \
     grep "notAfter=" | \
     sed 's/.*notAfter=\([^)]*\).*/\1/')

   days_until=$(date -d "${expiration}" +%s)
   now=$(date +%s)
   diff=$(( (days_until - now) / 86400 ))

   if [ ${diff} -lt 30 ]; then
     echo "WARNING: SSL expires in ${diff} days!"
   fi
   ```

3. **Set Up Alerts**:
   - Configure alerts for certificate expiration
   - Configure alerts for SSL errors
   - Configure alerts for DNS issues

### Firebase Monitoring

Monitor Firebase Hosting:

1. **Firebase Console**:
   - Check Hosting → Usage
   - Monitor bandwidth usage
   - Monitor storage usage
   - Check domain status

2. **Firebase Analytics**:
   - Monitor traffic patterns
   - Monitor user behavior
   - Monitor error rates
   - Set up custom events

3. **Error Tracking**:
   - Use Sentry for error tracking
   - Monitor SSL certificate errors
   - Monitor DNS resolution errors
   - Monitor 5xx errors

---

## Example DNS Records

### Production Environment

```
; attyfinancial.com - Production
; Generated: March 5, 2026
; TTL: 3600 seconds (1 hour)

; Apex domain (attyfinancial.com)
@                        IN A    3600    199.36.158.100
@                        IN A    3600    199.36.158.101
@                        IN A    3600    199.36.158.102
@                        IN A    3600    199.36.158.103
@                        IN TXT  3600    "v=spf1 include:_spf.google.com ~all"
@                        IN TXT  3600    "firebase=your-verification-token"
@                        IN MX   3600    10 alt1.aspmx.l.google.com.
@                        IN MX   3600    20 alt2.aspmx.l.google.com.

; WWW subdomain
www                      IN CNAME 3600    atty-financial-production.web.app.

; Staging subdomain
staging                   IN CNAME 3600    atty-financial-staging.web.app.

; DMARC
_dmarc                    IN TXT  3600    "v=DMARC1; p=none; rua=mailto:dmarc@attyfinancial.com"

; DKIM (if using custom email)
google._domainkey          IN TXT  3600    "v=DKIM1; k=rsa; p=your-dkim-record"
```

### Staging Environment

```
; staging.attyfinancial.com - Staging Environment
; Generated: March 5, 2026
; TTL: 3600 seconds (1 hour)

; Staging subdomain
staging                   IN CNAME 3600    atty-financial-staging.web.app.

; Google Workspace (shared with production)
@                        IN TXT  3600    "google-site-verification=your-verification-code"
@                        IN MX   3600    10 alt1.aspmx.l.google.com.
@                        IN MX   3600    20 alt2.aspmx.l.google.com.
```

---

## SSL Certificate Renewal Information

### Automatic Renewal Process

Firebase Hosting automatically renews SSL certificates:

| Event | Timing | Action |
|-------|--------|--------|
| **Renewal Check** | 30 days before expiration | Check renewal eligibility |
| **Renewal Request** | 25 days before expiration | Request new certificate |
| **Certificate Issuance** | 20-15 days before expiration | Issue new certificate |
| **Certificate Deployment** | 15-10 days before expiration | Deploy to CDN |
| **Old Certificate Expiration** | 0 days | Old certificate expires |

### Manual Renewal Check

Check if renewal is in progress:

```bash
# Check certificate expiration
echo | openssl s_client -showcerts -connect attyfinancial.com:443 2>&1 | \
  grep "notAfter=" | \
  sed 's/.*notAfter=\([^)]*\).*/\1/'

# Calculate days until expiration
cert_exp=$(openssl s_client -showcerts -connect attyfinancial.com:443 2>&1 | \
  grep "notAfter=" | \
  sed 's/.*notAfter=\([^)]*\).*/\1/' | \
  xargs -I {} date -d "{}" +%s)

now=$(date +%s)
days_until=$(( (cert_exp - now) / 86400 ))

echo "SSL certificate expires in ${days_until} days"

if [ ${days_until} -lt 30 ]; then
  echo "WARNING: Certificate expires in less than 30 days!"
fi
```

### Renewal Failures

If automatic renewal fails:

1. **Check DNS Records**:
   - Verify A records are correct
   - Verify CNAME records are correct
   - Check TXT records for verification

2. **Check Domain Status**:
   - Verify domain is not expired
   - Verify domain is not suspended
   - Check WHOIS information

3. **Check Firebase Console**:
   - Check SSL status in Hosting → Domains
   - Look for error messages
   - Check provisioning status

4. **Manual Intervention**:
   - Remove domain from Firebase Hosting
   - Re-add domain
   - Wait for SSL provisioning
   - Monitor status in Firebase Console

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Firebase Production Setup](./FIREBASE_PRODUCTION_SETUP.md)
- [CI/CD Documentation](./CI_CD.md)
- [GitHub Secrets Guide](./GITHUB_SECRETS.md)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase Custom Domains](https://firebase.google.com/docs/hosting/custom-domains)

---

## Appendix

### DNS Record Types

| Type | Purpose | Example |
|------|---------|---------|
| **A** | Maps domain to IPv4 address | `@ → 199.36.158.100` |
| **AAAA** | Maps domain to IPv6 address | `@ → 2001:db8::1` |
| **CNAME** | Maps subdomain to domain | `www → attyfinancial.com` |
| **MX** | Mail exchange for email | `@ → alt1.aspmx.l.google.com.` |
| **TXT** | Text information (SPF, verification) | `@ → "v=spf1..."` |
| **NS** | Name server (authoritative) | `@ → ns1.domain.com.` |
| **SOA** | Start of Authority (zone info) | `@ → ns1.domain.com.` |
| **SRV** | Service location (e.g., VoIP) | `_sip._tcp → sip.domain.com.` |

### Common DNS Providers

| Provider | DNS Management | DNSSEC | Cost |
|----------|----------------|---------|------|
| GoDaddy | Yes | Yes | Free |
| Namecheap | Yes | Yes | Free |
| Cloudflare | Yes | Yes | Free |
| Google Domains | Yes | Yes | Free |
| AWS Route 53 | Yes | Yes | $0.50/month per zone |
| Azure DNS | Yes | Yes | $0.50/month per zone |

### SSL Certificate Standards

| Standard | Description | Status |
|----------|-------------|--------|
| **TLS 1.0** | Deprecated (insecure) | Disabled |
| **TLS 1.1** | Deprecated (insecure) | Disabled |
| **TLS 1.2** | Current (secure) | Enabled |
| **TLS 1.3** | Latest (most secure) | Enabled |
| **PFS** | Perfect Forward Secrecy | Enabled |
| **HSTS** | HTTP Strict Transport Security | Enabled |

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
