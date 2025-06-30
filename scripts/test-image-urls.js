import fetch from 'node-fetch';

const testUrls = [
  'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/f53df428-db87-4e65-a1db-19c09f7f7fd3/1751196036680',
  'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/e60de5e2-5431-4c30-b4f8-2c1a1670693b/1751186486659',
  'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/e60de5e2-5431-4c30-b4f8-2c1a1670693b/1751185685732',
  'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/3b242145-301f-40fc-ab38-88c54173d73a/1751184176587',
  'https://dijtrtaydurrhkgmulnj.supabase.co/storage/v1/object/public/post-images/b20dfe57-4147-4e58-9e8c-2152187f18b6/1751141570968',
];

async function testImageUrl(url) {
  try {
    console.log(`\n🧪 Testing: ${url}`);
    
    const response = await fetch(url, {
      method: 'HEAD', // Only get headers, not the full image
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type') || 'unknown'}`);
    console.log(`📐 Content-Length: ${response.headers.get('content-length') || 'unknown'}`);
    
    if (response.ok) {
      console.log('✅ Image URL is accessible');
      return { url, status: 'success', httpStatus: response.status };
    } else {
      console.log('❌ Image URL returned error');
      return { url, status: 'error', httpStatus: response.status };
    }
    
  } catch (error) {
    console.log(`❌ Error accessing URL: ${error.message}`);
    return { url, status: 'error', error: error.message };
  }
}

async function main() {
  console.log('🚀 Testing image URL accessibility...\n');
  
  const results = [];
  
  for (const url of testUrls) {
    const result = await testImageUrl(url);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'error');
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed URLs:');
    failed.forEach(f => {
      console.log(`  - ${f.url}`);
      console.log(`    Error: ${f.error || `HTTP ${f.httpStatus}`}`);
    });
  }
  
  if (successful.length > 0) {
    console.log('\n✅ Working URLs for testing:');
    successful.slice(0, 3).forEach(s => {
      console.log(`  '${s.url}',`);
    });
  }
}

main().catch(console.error);