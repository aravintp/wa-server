const express = require('express')
const app = express()
const port = 8080


app.get('/', (req, res) => {
  res.send('Reached main page')
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

app.post('/', (req, res) => {
  res.send('Got a POST request')
})

app.put('/user', (req, res) => {
  res.send('Got a PUT request at /user')
})

app.delete('/user', (req, res) => {
  res.send('Got a DELETE request at /user')
})

module.exports = app;