import express from 'express'
import autok from './routes/autok.js'
import ugyfelek from './routes/ugyfelek.js'
import statisztika from './routes/statisztika.js'
import berlesek from './routes/berlesek.js'

const app = express();
const port = 3000;

app.use(express.json());


app.use('/autok', autok)
app.use('/ugyfelek', ugyfelek)
app.use('/statisztika', statisztika)
app.use('/berlesek', berlesek)

app.listen(port,()=>{
    console.log(`Server is running: http://localhost:${port}`);
})