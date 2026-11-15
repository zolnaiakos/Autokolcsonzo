import express from 'express'
import autok from './routes/autok.js'

const app = express();
const port = 3000;



app.use('/autok', autok)

app.listen(port,()=>{
    console.log(`Server is running: http://localhost:${port}`);
})