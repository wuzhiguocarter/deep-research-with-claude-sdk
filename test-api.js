const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'test research',
        type: 'summary'
      })
    })

    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers))

    const text = await response.text()
    console.log('Response:', text.substring(0, 500))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testAPI()
