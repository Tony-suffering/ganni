import fetch from 'node-fetch'

const supabaseUrl = 'https://dijtrtaydurrhkgmulnj.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpanRydGF5ZHVycmhrZ211bG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTg4NTcsImV4cCI6MjA2NTQ5NDg1N30.I1jlEi7lisjrUGj9qA77D_KKLhQPojw5t8wY-i0U7No'

async function testAPI() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/posts?select=id,title,user_comment,image_url,created_at&image_url=not.is.null&order=created_at.desc&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers.raw())
    
    const data = await response.json()
    console.log('\nResponse data:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

testAPI()