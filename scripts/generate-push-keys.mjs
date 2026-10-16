import fs from 'node:fs'
import webpush from 'web-push'
const file = '.env.push.local'
const keys = webpush.generateVAPIDKeys()
fs.writeFileSync(file, `# Keep private. Copy these values to Netlify environment variables (Functions scope).\nWEB_PUSH_ENABLED=true\n# Set true ONLY after verifying the Netlify team is on the hard-capped Free plan.\nWEB_PUSH_FREE_PLAN_CONFIRMED=false\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\nVAPID_CONTACT=mailto:replace-with-your-email@example.com\n`, { flag: 'wx', mode: 0o600 })
console.log('Created .env.push.local (git-ignored). Private values were not printed. Follow docs/notifications.md.')
