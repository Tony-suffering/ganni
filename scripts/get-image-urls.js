import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getImageUrls() {
  try {
    console.log('🔍 Fetching posts from database...');
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Database error:', error);
      return [];
    }
    
    console.log(`📊 Found ${posts?.length || 0} posts`);
    
    if (!posts || posts.length === 0) {
      console.log('📝 No posts found in database');
      
      // Test with some sample storage URLs based on your project
      const testUrls = [
        `${supabaseUrl}/storage/v1/object/public/post-images/sample1.jpg`,
        `${supabaseUrl}/storage/v1/object/public/post-images/sample2.jpg`,
        `${supabaseUrl}/storage/v1/object/public/post-images/sample3.jpg`,
      ];
      
      console.log('🧪 Using test URLs:');
      testUrls.forEach(url => console.log(`  - ${url}`));
      
      return testUrls;
    }
    
    console.log('📷 Image URLs found:');
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`);
      console.log(`   URL: ${post.image_url}`);
      console.log(`   Created: ${post.created_at}`);
      console.log('');
    });
    
    return posts.map(post => post.image_url);
    
  } catch (error) {
    console.error('❌ Error fetching image URLs:', error);
    return [];
  }
}

// Also check storage bucket contents
async function checkStorageBucket() {
  try {
    console.log('\n🗄️ Checking storage bucket contents...');
    
    const { data: files, error } = await supabase.storage
      .from('post-images')
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error('❌ Storage error:', error);
      return [];
    }
    
    console.log(`📁 Found ${files?.length || 0} files in storage`);
    
    if (files && files.length > 0) {
      console.log('📂 Storage files:');
      const storageUrls = [];
      
      for (const file of files) {
        const { data } = supabase.storage
          .from('post-images')
          .getPublicUrl(file.name);
        
        console.log(`  - ${file.name} (${file.metadata?.size || 'unknown size'})`);
        console.log(`    URL: ${data.publicUrl}`);
        storageUrls.push(data.publicUrl);
      }
      
      return storageUrls;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error checking storage:', error);
    return [];
  }
}

async function main() {
  console.log('🚀 Getting actual image URLs for testing...\n');
  
  const postUrls = await getImageUrls();
  const storageUrls = await checkStorageBucket();
  
  const allUrls = [...new Set([...postUrls, ...storageUrls])];
  
  console.log('\n📋 Summary of available URLs:');
  if (allUrls.length > 0) {
    allUrls.slice(0, 5).forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
  } else {
    console.log('❌ No image URLs found');
  }
  
  // Output URLs for easy copying
  console.log('\n📋 URLs for ImageDebugTest component:');
  const testUrls = allUrls.slice(0, 5);
  console.log('const testUrls = [');
  testUrls.forEach(url => {
    console.log(`  '${url}',`);
  });
  console.log('];');
}

main().catch(console.error);