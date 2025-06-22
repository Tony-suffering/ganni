// VAPID鍵生成スクリプト
const webpush = require('web-push');

console.log('🔑 VAPID鍵を生成中...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID鍵が生成されました！\n');
console.log('📋 以下の値を環境変数に設定してください：\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:your-email@domain.com');
console.log('\n⚠️  これらの鍵は安全に保管してください！');
console.log('   特にprivateKeyは外部に漏らさないでください。');