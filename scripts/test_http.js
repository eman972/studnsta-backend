fetch('http://localhost:5000/api/posts/fakeid/save', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer faketoken' }
})
.then(res => console.log('Status:', res.status))
.catch(err => console.error(err));
