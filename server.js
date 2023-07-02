const express = require('express')
const app = express()
const port = 8000
const MongoClient = require('mongodb').MongoClient;

app.use(express.urlencoded({extended : true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.get('/write',(req,res)=>{
  res.render('write.ejs')
})


let db;

MongoClient.connect('mongodb+srv://hyeonwoo:qwer1234@cluster0.szzp2iu.mongodb.net/?retryWrites=true&w=majority', {useUnifiedTopology: true} ,function(에러, client){
  if (에러) return console.log(에러);
  db = client.db('todoapp')
  app.listen(port, ()=>{
    console.log('start 8000')
  })
})

app.post('/add',(req,res)=>{
  db.collection('post').insertOne({title:req.body.title,date:req.body.date},(error,result)=>{
    if(error) console.log(error)
    res.send('전송완료')
    console.log('저장완료')
    console.log(result)
  })
})


