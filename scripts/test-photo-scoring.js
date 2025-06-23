import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize Supabase client with the correct keys
const supabaseUrl = 'https://dijtrtaydurrhkgmulnj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpanRydGF5ZHVycmhrZ211bG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTg4NTcsImV4cCI6MjA2NTQ5NDg1N30.I1jlEi7lisjrUGj9qA77D_KKLhQPojw5t8wY-i0U7No'

console.log('Using Supabase URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function getRecentPostsWithImages() {
  console.log('Querying posts table for recent posts with images...\n')
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, user_comment, image_url, created_at')
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