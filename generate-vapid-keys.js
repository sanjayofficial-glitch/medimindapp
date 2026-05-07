import crypto from 'crypto';
import webpush from 'webpush';

// Generate VAPID keys
const vapidKeys = webpush.generateVapidKeys();
console.log('VAPID Keys Generated:');
console.log('===================');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('===================');
console.log('\nUse these keys as follows:');
console.log('1. Public Key (for frontend): ' + vapidKeys.publicKey);
console.log('2. Private Key (for Supabase secrets): ' + vapidKeys.privateKey);