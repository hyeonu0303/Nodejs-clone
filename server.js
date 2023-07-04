const express = require('express')
const app = express()
const port = 8000
const MongoClient = require('mongodb').MongoClient;
app.set('view engine','ejs')
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
  db.collection('counter').findOne({name: '게시물갯수'}, (error,result)=>{
    let totalPost = result.totalPost
    db.collection('post').insertOne({_id:(totalPost + 1),title:req.body.title,date:req.body.date},(error,result)=>{
      console.log(result)
      db.collection('counter').updateOne({name:'게시물갯수'},{$inc : {totalPost:1}},(error,result)=>{
        if(error) console.log(error)
        res.send('전송완료')
        console.log('저장완료')
      })
    })
  })
})

//list GET요청처리
app.get('/list',(req,res)=>{
  db.collection('post').find().toArray((error,result)=>{
    if(error) console.log(error)
    console.log(result)
    //파일을 보낼때 함께 DB데이터도 전송
    res.render('list.ejs', {posts: result})
  })
})

//Ajax삭제요청시 
app.delete('/delete',(req,res)=>{
  req.body._id = parseInt(req.body._id)
  db.collection('post').deleteOne(req.body,(error,result)=>{
    if(error) console.log(error)
    console.log(result)
    console.log('삭제완료')
  })
  res.send('삭제완료')
})





