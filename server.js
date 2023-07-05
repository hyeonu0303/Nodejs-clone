const express = require('express')
const app = express()
const port = 8000
const MongoClient = require('mongodb').MongoClient;
app.set('view engine','ejs')
app.use(express.urlencoded({extended : true}))
app.use(express.json());

const methodOverride = require('method-override')
app.use(methodOverride('_method'))

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
  //_id가 str로 받아와져서 이렇게됨
  //req.body._id = parseInt(req.body._id)
  let id = parseInt(req.params.id);
  console.log(id)
  db.collection('post').deleteOne(id,(error,result)=>{
    if(error) console.log('삭제요청:'+error)
    res.send('삭제완료')
  })
})

app.get('/detail/:id',(req,res)=>{
  db.collection('post').findOne({_id : parseInt(req.params.id)},(error,result)=>{
    //detail/1로 보여주세요
    res.render('detail.ejs',{data: result})
  })
})

//edit.ejs GET요청처리
app.get('/edit/:id',(req,res)=>{
  //제목과 date값을 찾아서 data로 전달해줘야함 
  //parseInt(req.params.id)
  db.collection('post').findOne({_id : parseInt(req.params.id)},(error,result)=>{
    if(error) console.log(error)
    console.log(result)
    res.render('edit.ejs',{data : result})
  })
}) 

app.put('/edit',(req,res)=>{
  db.collection('post').updateOne({_id: parseInt(req.body.id)},
  {$set:{title:req.body.title, date:req.body.date}},
  (error,result)=>{
    if(error) console.log(error)
    console.log('수정완료')
    res.redirect('/list')
  })
})



