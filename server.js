const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient;
app.set('view engine','ejs')
app.use(express.urlencoded({extended : true}))
app.use(express.json());
//login 라이브러리
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 
//method-override
const methodOverride = require('method-override')
app.use(methodOverride('_method'))


passport.use(new LocalStrategy({
  usernameField: 'id', //(요기는 사용자가 제출한 아이디가 어디 적혔는지) 
    passwordField: 'pw', //(요기는 사용자가 제출한 비번이 어디 적혔는지) 
    session: true, //(요기는 세션을 만들건지) 
    passReqToCallback: false, //(요기는 아이디/비번말고 다른 정보검사가 필요한지) 
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  //아이디/비번을 DB데이터와 비교
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

//세션만들고 세션아이디 발급해서 쿠키로 보내주기
passport.serializeUser(function (user, done) {
  done(null, user.id)
});

//로그인한 유저의 개인정보를 DB에서 찾는 역할
passport.deserializeUser(function (아이디, done) {
  //디비에서 위에있는 user.id를 유저를 찾은 뒤에 유저정보를 밑에넣음 아이디 == user.id
  db.collection('login').findOne({id:아이디},(error,result)=>{
    done(null, result)
  })
});
//로그인 미들웨어(로그인했는지안했는지)
let 로그인했니 = (req,res,next)=>{
  if(req.user){
    next()
  }else{
    res.send('로그인 하셔야될듯요')
  }
} 
//dotenv
require('dotenv').config()
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})
app.get('/write',(req,res)=>{
  res.render('write.ejs')
})

let db;
MongoClient.connect(process.env.DB_URL, {useUnifiedTopology: true} ,function(에러, client){
  if (에러) return console.log(에러);
  db = client.db('todoapp')
  app.listen(process.env.PORT, ()=>{
    console.log('start 8000')
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
  req.body._id = parseInt(req.body._id);
  db.collection('post').deleteOne({_id:req.body._id, 작성자 : req.user._id},(error,result)=>{
    db.collection('counter').updateOne({name:'게시물갯수'},{$inc : {totalPost: -1}},(error,result)=>{
      if(error) console.log('삭제요청:'+error)
      res.send('삭제완료')
    })
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

//login
app.get('/login',(req,res)=>{
  res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {failureRedirect : '/fail'}), function(요청, 응답){
  응답.redirect('/')
});

//mypage
app.get('/mypage',로그인했니,(req,res)=>{
    console.log(req.user)
    res.render('mypage.ejs',{user : req.user}) 
})
//검색기능구현
app.get('/search', (req, res)=>{
  //인덱스 만들어둔것 <- mongo db
  //find({$text: {$search: req.query.value}}) 쉽게 다 찾아낼수있음
  //aggregate({},{},{}) 검색조건을 여러개 달 수 있음
  let 검색조건 = [
    {
      $search: {
        index: 'titleSearch', //내가만든 인덱스명
        text: {
          query: req.query.value,
          path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    }
  ]
  db.collection('post').aggregate(검색조건).toArray((error,result)=>{
    console.log(result)
    res.render('search.ejs',{posts:result})
  })
})

//회원가입페이지
app.get('/register',(req,res)=>{
  res.render('register.ejs')
})
app.post('/register',(req,res)=>{
  //로직의문제점 test4라는걸 입력하면 찾는값이 result가 null이니까 당연히안됨
  db.collection('login').findOne({id:req.body.id},(error,result)=>{
    if(error) console.log(error)
    else if(result) res.send('아이디중복발생!')
    else{
      db.collection('login').insertOne({id:req.body.id,pw:req.body.pw},(error,result)=>{
        if(error) console.log(error)
        console.log('회원가입완료')
        res.redirect('/login')
      })
    }
  })
})

app.post('/add',(req,res)=>{
  db.collection('counter').findOne({name: '게시물갯수'}, (error,result)=>{
    let totalPost = result.totalPost
    db.collection('post').insertOne({_id:(totalPost + 1),작성자:req.user._id,title:req.body.title,date:req.body.date},(error,result)=>{
      console.log(result)
      db.collection('counter').updateOne({name:'게시물갯수'},{$inc : {totalPost:1}},(error,result)=>{
        if(error) console.log(error)
        res.send('전송완료')
        console.log('저장완료')
      })
    })
  })
})
//이미지올리는기능
let multer = require('multer')
var storage = multer.diskStorage({
  destination : (req,file,cb)=>{
    cb(null, './public/img')
  },
  filename : (req,file, cb)=>{
    cb(null, file.originalname)
  }
})

let upload = multer({storage:storage})

app.get('/upload',(req,res)=>{
  res.render('upload.ejs')
})

app.post('/upload',upload.single('profile'),(req,res)=>{
  res.send('완료')
})

app.get('/chat/:id',(req,res)=>{
  db.collection('post').findOne({_id:parseInt(req.params.id)},(error,result)=>{
    //db에 데이터입력한걸 넣어줘야함
    //작성자의 id필요, input내용, 방이름(게시물의 이름따오면됨)
    db.collection('chat').insertOne({member: req.user._id,title:result.title,date:new Date()})
    res.render('chat.ejs')
  })
})