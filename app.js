//Iniciar projeto em localhost:3000/home-no-user


const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const mysql2 = require('mysql2');
const bodyParser = require('body-parser')
const { faker } = require('@faker-js/faker');
const categories = ['TI & Software', 'Desenvolvimento', 'Finanças', 'Produtividade', 'Pessoal', 'Design', 'Marketing', 'Lifestyle', 'Fotografia & Video', 'Saude & Fitness', 'Musica']

const dificulties = ['principiante', 'intermedio', 'avançado']

const languages = ['ingles', 'portugues', 'alemao', 
'japones', 'italiano', 'frances']



const app = express();



// Set up view engine 
app.set('view engine', 'ejs'); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"))
app.use(express.json());

app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: true,
}))




const con = mysql2.createConnection({ 
    host: 'localhost', 
    user: 'root', 
    password: 'admin', 
    database: 'percursos',
    dateStrings: 'date' 
}); 

 con.connect(function(err) { 
     if (err) throw err;  

     console.log("Connected to MySQL database!");  

 });  

 

 const port = 3000;  

 app.listen(port, () => {  

     console.log(`Server started on port ${port}`);  

 });



 //Unsplash API
let accessKey = 'jpHCVzE2x4JHJE1w04rm0iJ9dluwQhUTqUe7dni3C4A'

function unsplashFetch(searchTerm) {
  return fetch(`https://api.unsplash.com/search/photos?client_id=${accessKey}&query=${searchTerm}`)
    .then(response => response.json())
    .then(data => {
      return data.results[0].urls.regular;
    });
}


 //setup express app.get pages for homepage, podcast, cursos, categorias, acerca de, user, sign up, sign in

 app.get('/home', (req, res) => {
    con.query('select * from cursos order by discount desc', (err, results) =>{
      if (err) throw err;
      con.query('select * from cursos order by rating desc', (err, results2) => {
        if (err) throw err;
        con.query('select * from cursos order by cursos_id desc', (err, results3) => {
          if (err) throw err;
          res.render('home', { 
            page: 'home',
            coursesDiscount: results,
            coursesRating: results2,
            coursesDate: results3
           });
          
  
  
        })


      })
      
    })

    
  });

  app.get('/home-no-user', (req, res) => {
    con.query('select * from cursos order by discount desc', (err, results) =>{
      if (err) throw err;
      con.query('select * from cursos order by rating desc', (err, results2) => {
        if (err) throw err;
        con.query('select * from cursos order by cursos_id desc', (err, results3) => {
          if (err) throw err;
          res.render('home-no-user', { 
            page: 'home-no-user',
            coursesDiscount: results,
            coursesRating: results2,
            coursesDate: results3
           });
          
  
  
        })


      })
      
    })

    
  });
  
  app.get('/categorias', (req, res) => {
    con.query('select category_name from category', (err, results) => {
      if (err) throw err;
      res.render('categorias', { page: 'categorias', categories: results });
    })
    
    
  });

  app.get('/curso/:curso', (req, res) => {
    const cursoID = req.params.curso;
    const myUserId = req.session.userId;
    console.log('my id is:', myUserId);
    
    con.query(`SELECT cursos.*, users.username, users.avatar FROM cursos JOIN users ON cursos.user_id = users.user_id WHERE cursos_id = '${cursoID}'`, (err, results) => {
        if (err) throw err;
        unsplashFetch(results[0].title).then(url => {
            let cursoUrl = url;
            console.log(results);
            con.query(`SELECT initiated, favourited FROM user_cursos WHERE user_id = '${myUserId}' AND cursos_id = '${cursoID}'`, (err, results2) => {
                if (err) throw err;
                let initiated, favourited;
                if (results2.length > 0) {
                    initiated = results2[0].initiated;
                    favourited = results2[0].favourited;
                } else {
                    initiated = false;
                    favourited = false;
                }
                con.query(`SELECT * FROM cursos WHERE category = (SELECT category FROM cursos WHERE cursos_id = '${cursoID}')`, (err, results3) => {
                    if (err) throw err;
                    res.render('curso/curso', { curso: results[0], cursoUrl, cursos: results3, myUserId, initiated, favourited });
                });
            });
        });
    });
});


  

  
  
  app.get('/check-entry/:userId/:courseId', (req, res) => {
    let userId = req.params.userId;
    let courseId = req.params.courseId;
    let checkEntrySql = `SELECT * FROM user_cursos WHERE user_id = ${userId} AND cursos_id = ${courseId}`;
  
    // Execute the SQL query
    con.query(checkEntrySql, (error, results) => {
      if (error) throw error;
      // If the user has an entry for the course, return true, otherwise return false
      if (results.length > 0) {
        res.send('true');
      } else {
        res.send('false');
      }
    });
  });

  app.post('/add-entry', (req, res) => {
    const userId = req.body.userId;
    const courseId = req.body.courseId;
    const initiated = req.body.initiated;
    const favourited = req.body.favourited;
    

    const insertSql = `INSERT INTO user_cursos (id, user_id, cursos_id, shared, favourited, initiated) VALUES (null, '${userId}', '${courseId}', true, ${favourited}, ${initiated})`;
    con.query(insertSql, (error, results) => {
        if(error) throw error;
        res.send('New entry added successfully.');
    });
});

app.post('/update-entry', (req, res) => {
  const userId = req.body.userId;
  const courseId = req.body.courseId;
  let initiated = req.body.initiated == true ? 1 : 0;
  let favourited = req.body.favourited == true ? 1 : 0;

  const updateSql = `UPDATE user_cursos SET initiated = '${initiated}', favourited = '${favourited}' WHERE user_id = '${userId}' AND cursos_id = ${courseId}`;
  con.query(updateSql, (error) => {
      if(error) throw error;
      res.send('User\'s entry updated successfully.');
  });
});
  

  app.get('/categorias/:category', function(req, res) {
    const categoria = req.params.category;
    con.query(`SELECT * FROM cursos WHERE category = '${categoria}'`, function(error, results) {
      if (error) throw error;
      
      
      res.render('categorias/category', { categoria, categories: results });
    });
  });


  app.get('/category', (req, res) => {
    res.render('category', { page: 'category' });
  });

  app.get('/curso', (req, res) => {
    
    res.render('curso',
     { page: 'curso',
       userId
    });
  });
  
  app.get('/podcast', (req, res) => {
    res.render('podcast', { page: 'podcast' });
  });

  app.get('/sobrenos', (req, res) => {
    res.render('sobrenos', { page: 'sobrenos' });
  });

  app.get('/user', (req, res) => {
    con.query(`SELECT user_cursos.user_id, user_cursos.cursos_id, user_cursos.shared, user_cursos.favourited, user_cursos.initiated, cursos.title, cursos.link
    FROM user_cursos
    INNER JOIN cursos ON user_cursos.cursos_id = cursos.cursos_id where user_cursos.user_id = '${req.session.userId}'`, (err, results) => {
      if (err) throw err;
      let allRes = results;
      let fav = allRes.filter(e => e.favourited === 1)
      let init = allRes.filter(e => e.initiated === 1)
      
      res.render('user', { 
        page: 'user',
         name: req.session.name,
         user: req.session.user,
         dob: req.session.dob,
         loc: req.session.location,
         edu: req.session.education,
         web: req.session.website,
         allRes: allRes,
         fav: fav,
         init: init
          });
    })

    
  });

  app.get('/fav', (req, res) => {
    con.query(`SELECT user_cursos.user_id, user_cursos.cursos_id, user_cursos.shared, user_cursos.favourited, user_cursos.initiated, cursos.title, cursos.link
    FROM user_cursos
    INNER JOIN cursos ON user_cursos.cursos_id = cursos.cursos_id where user_cursos.user_id = '${req.session.userId}'`, (err, results) => {
      if (err) throw err;
      let allRes = results;
      let fav = allRes.filter(e => e.favourited === 1)
      let init = allRes.filter(e => e.initiated === 1)
      
      res.render('fav', { 
        page: 'fav',
         name: req.session.name,
         user: req.session.user,
         dob: req.session.dob,
         loc: req.session.location,
         edu: req.session.education,
         web: req.session.website,
         allRes: allRes,
         fav: fav,
         init: init
          });
    })

    
  });

  app.get('/init', (req, res) => {
    con.query(`SELECT user_cursos.user_id, user_cursos.cursos_id, user_cursos.shared, user_cursos.favourited, user_cursos.initiated, cursos.title, cursos.link
    FROM user_cursos
    INNER JOIN cursos ON user_cursos.cursos_id = cursos.cursos_id where user_cursos.user_id = '${req.session.userId}'`, (err, results) => {
      if (err) throw err;
      let allRes = results;
      let fav = allRes.filter(e => e.favourited === 1)
      let init = allRes.filter(e => e.initiated === 1)
      
      res.render('init', { 
        page: 'init',
         name: req.session.name,
         user: req.session.user,
         dob: req.session.dob,
         loc: req.session.location,
         edu: req.session.education,
         web: req.session.website,
         allRes: allRes,
         fav: fav,
         init: init
          });
    })

    
  });

  app.get('/term', (req, res) => {
    con.query(`SELECT user_cursos.user_id, user_cursos.cursos_id, user_cursos.shared, user_cursos.favourited, user_cursos.initiated, cursos.title, cursos.link
    FROM user_cursos
    INNER JOIN cursos ON user_cursos.cursos_id = cursos.cursos_id where user_cursos.user_id = '${req.session.userId}'`, (err, results) => {
      if (err) throw err;
      let allRes = results;
      let fav = allRes.filter(e => e.favourited === 1)
      let init = allRes.filter(e => e.initiated === 1)
      
      res.render('term', { 
        page: 'term',
         name: req.session.name,
         user: req.session.user,
         dob: req.session.dob,
         loc: req.session.location,
         edu: req.session.education,
         web: req.session.website,
         allRes: allRes,
         fav: fav,
         init: init
          });
    })

    
  });

  app.get('/no-user', (req, res) => {
    res.render('no-user', { page: 'no-user' });
  });

  app.get('/sign-up', (req, res) => {
    res.render('sign-up', { page: 'sign-up' });
  });

  app.get('/sign-up-registo', (req, res) => {
    res.render('sign-up-registo', { page: 'sign-up-registo' });
  });

  app.get('/sign-up-preferencias', (req, res) => {
    res.render('sign-up-preferencias', { page: 'sign-up-preferencias' });
  });

  app.get('/sign-up-notif', (req, res) => {
    res.render('sign-up-notif', { page: 'sign-up-notif' });
  });

  app.get('/sign-in', (req, res) => {
    res.render('sign-in', { page: 'sign-in' });
  });


  app.get('/partilhar', (req, res) => {
    res.render('partilhar', { page: 'partilhar', categories: categories });
  });

  app.post('/sign-up', (req, res) => {
    req.session.name = req.body.name;
    req.session.username = req.body.username;
    req.session.dob = req.body.dob;
    req.session.location = req.body.location;
    req.session.website = req.body.website;
    req.session.education = req.body.education;
      console.log(req.session)
      res.redirect('/sign-up-registo')
    });

    app.post('/partilhar', (req, res) => {
      req.session.link = req.body.link;
      req.session.title = req.body.title;
      req.session.description = req.body.description;
      req.session.price_now = req.body.price_now;
      req.session.price_og = req.body.price_og;
      req.session.date_init = req.body.date_init;
      req.session.date_end = req.body.date_end;
      req.session.category = req.body.category;

      let discount = (1 - req.body.price_now / req.body.price_og) * 100
        
        let q = 'INSERT INTO cursos (cursos_id, link, title, description, price_now, price_og, date_init, date_end, category, discount, duration, dificulty, lang, rating, user_id) VALUES (null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)'

        let vals = [
          req.session.link,
          req.session.title,
          req.session.description,
          req.session.price_now,
          req.session.price_og,
          req.session.date_init,
          req.session.date_end,
          req.session.category,
          discount,
          24,
          'intermedio',
          'portugues',
          req.session.userId

        ]

        con.query(q, vals, (err, results) => {
          if (err) throw err;
          res.redirect('/home')

        })
        
      });

    app.post('/sign-up-registo', (req, res) => {
      req.session.email = req.body.email;
      req.session.password = req.body.password;
        console.log(req.session)
        res.redirect('/sign-up-preferencias')
      });

      app.post('/sign-up-preferencias', (req, res) => {
        req.session.language = req.body.language;
        req.session.area = req.body.area;
          console.log(req.session)
          res.redirect('/sign-up-notif')
        });

        app.post('/sign-up-notif', (req, res) => {
          if (req.body.notif = 'on') {
            req.session.notif = 1;
         
          } else {
            req.session.notif = 0
          }
           
          

        let q = 'insert into users (user_id, fname, username, email, password, dob, loc, website, edu, lang, area, notif, avatar) VALUES (null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'

        let vals = [
          req.session.name,
          req.session.username,
          req.session.email,
          req.session.password,
          req.session.dob,
          req.session.location,
          req.session.website,
          req.session.education,     
          req.session.language,
          req.session.area,
          req.session.notif,
          '/assets/images/user'
        ]

        con.query(q, vals, (err, results) => {
         if (err) throw err;         
        })
            console.log(req.session)
            res.redirect('/sign-in')
          });

app.post('/sign-in', (req, res) => {
  con.query(`select * from users where email = '${req.body.email}'`, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      let user = results[0];
      if (req.body.password == user.password) {
        req.session.user = user.username;
        req.session.name = user.fname;
        req.session.dob = user.dob;
        req.session.location = user.loc;
        req.session.website = user.website;
        req.session.userId = user.user_id
        console.log(req.session)
        res.redirect('/home')
      } else {
        console.log('password or username invalid')
      }
    } else {
      console.log('invalid username or password')
    }
  })
    

    
  });

  // function insertData() {
  //   const id = Math.floor((Math.random() * 12));
  //   const link = faker.internet.url();
  //   const title = faker.commerce.productName();
  //   const description = faker.lorem.paragraphs(1);
    
  //   const price_now = Math.floor((Math.random() * 100));
  //   const price_og = Math.floor((Math.random() * 100));
  //   const thumbnail = faker.image.imageUrl();
  //   const date_init = faker.date.future();
  //   const date_end = faker.date.past()
  //   const duration = Math.floor((Math.random() * 100));
  //   const dificulty = faker.helpers.arrayElement(dificulties)
  //   const language = faker.helpers.arrayElement(languages)
    
    
  //   con.query('INSERT INTO cursos (cursos_id, link, title, description, price_now, price_og, date_init, date_end, category, duration, dificulty, lang) VALUES (null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [link, title, description, price_now, price_og, date_init, date_end, categories[Math.floor((Math.random() * 11))], duration, dificulty, language], (err, results) => {
  //     if (err) throw err;
  //   })

  //   function insertDataUsers() {
  //  let fname = faker.name.firstName();
  //  let username = faker.internet.userName();
  //  let email = faker.internet.email();
  //  let password = faker.internet.password();
  //  let dob = faker.date.past(18);
  //  let loc = faker.address.country();
  //  let website = faker.internet.url();
  //  let edu = `${faker.address.city} University`
  //  let lang = faker.helpers.arrayElement(languages)
  //  let area = faker.helpers.arrayElement(categories)
  //  let notif = 1
  //  let avatar = faker.internet.avatar()


    
  //   con.query('INSERT INTO users (user_id, fname, username, email, password, dob, loc, website, edu, lang, area, notif, avatar) VALUES (null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [fname, username, email, password, dob, loc, website, edu, lang, area, notif, avatar], (err, results) => {
  //     if (err) throw err;
  //   })
    
    
    
      
  //   }

  //   for (let i = 0; i < 20; i++) {
  //     insertDataUsers()
  //   }
   