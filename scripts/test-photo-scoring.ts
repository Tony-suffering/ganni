import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { Database } from '../src/types'

// Load environment variables
dotenv.config()

// Initialize Supabase client with service role key for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dijtrtaydurrhkgmulnj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpanRydGF5ZHVycmhrZ211bG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTkxODg1NywiZXhwIjoyMDY1NDk0ODU3fQ.gUmDcI-7OFBjSgxB5L5jN5Zy5T2iD3QJwE6FxKvz3lU'

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function getRecentPostsWithImages() {
  console.log('Querying posts table for recent posts with images...\n')
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, user_comment, image_url, created_at, user_id')
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error fetching posts:', error)
    return
  }
  
  if (!posts || posts.length === 0) {
    console.log('No posts with images found.')
    return
  }
  
  console.log(`Found ${posts.length} posts with images:\n`)
  
  posts.forEach((post, index) => {
    console.log(`\n--- Post ${index + 1} ---`)
    console.log(`ID: ${post.id}`)
    console.log(`Title: ${post.title || 'No title'}`)
    console.log(`User Comment: ${post.user_comment || 'No comment'}`)
    console.log(`Image URL: ${post.image_url}`)
    console.log(`Created: ${new Date(post.created_at).toLocaleString()}`)
    console.log(`User ID: ${post.user_id}`)
  })
  
  // Select the first post for testing
  if (posts.length > 0) {
    const testPost = posts[0]
    console.log('\n\n========================================')
    console.log('SELECTED POST FOR TESTING:')
    console.log('========================================')
    console.log(`Post ID: ${testPost.id}`)
    console.log(`Title: ${testPost.title || 'No title'}`)
    console.log(`User Comment: ${testPost.user_comment || 'No comment'}`)
    console.log(`Image URL: ${testPost.image_url}`)
    console.log('\nYou can use this data to test the PhotoScoringService.')
  }
}

// Run the query
getRecentPostsWithImages()
  .then(() => console.log('\nQuery completed.'))
  .catch(console.error)