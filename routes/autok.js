import pool from '../data/db.js'
import { Router } from 'express'

const router = Router()


router.get('/', async(req,res)=>{

    const {kategoria} = req.query

     if (kategoria && !['kicsi', 'közép', 'egyterű'].includes(kategoria)) {
    return res.status(400).json({
        error: 'Érvénytelen kategória'
    })
    }

    let sql = `
    SELECT a.id, a.rendszam, a.marka, a.modell, a.kategoria, a.napidij, COUNT(b.id) AS berlesDb
    FROM autok a  
    LEFT JOIN berlesek b ON b.auto_id = a.id
  
`

    let kateg = []
   

    if(kategoria){
        sql += ' WHERE a.kategoria = ?'
        kateg.push(kategoria)
    }

    sql += '  GROUP BY a.id, a.rendszam, a.marka, a.modell, a.kategoria, a.napidij'

    sql += ' ORDER BY a.rendszam ASC'

    

    const [eredmeny] = await pool.query(sql,kateg)

    res.json(eredmeny)
})

router.get('/szabad', async(req,res)=>{

    let {tol,ig } = req.query


    let sql = `
    SELECT a.id, a.rendszam, a.marka, a.modell, a.kategoria, a.napidij, COUNT(b.id) AS berlesDb
    FROM autok a  
    LEFT JOIN berlesek b ON b.auto_id = a.id
`
    
    let szabad = []

    if(tol && ig && (tol) > (ig)){
        [tol, ig] = [ig, tol];
    }

    if (tol && ig) {
    sql += `
        WHERE a.id NOT IN (
            SELECT auto_id
            FROM berlesek
            WHERE kezdet <= ? AND veg >= ?
        )
    `
    szabad.push(ig, tol)
}

    sql += '  GROUP BY a.id, a.rendszam, a.marka, a.modell, a.kategoria, a.napidij'

    sql += ' ORDER BY a.napidij ASC'


    const [eredmeny] = await pool.query(sql,szabad)


    res.json(eredmeny)

})

router.get('/:id', async(req,res)=>{
    const { id } = req.params


    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            error: "Hibás azonosító"
        });
    }

    const [autok] = await pool.query(
        'SELECT * FROM autok WHERE id = ?',
        [id]
    )

    const [berles] = await pool.query( `
    SELECT b.id, u.nev AS ugyfel, DATE_FORMAT(b.kezdet, '%Y-%m-%d') AS kezdet, DATE_FORMAT(b.veg, '%Y-%m-%d') AS veg, DATEDIFF(b.veg, b.kezdet) + 1 AS napok, (DATEDIFF(b.veg, b.kezdet) + 1) * a.napidij AS dij 
    FROM berlesek b
    LEFT JOIN ugyfelek u ON u.id = b.ugyfel_id     
    LEFT JOIN autok a ON a.id = b.auto_id
    WHERE b.auto_id = ?
    ORDER BY b.kezdet ASC
`,[id])

    if (autok.length === 0) {
        return res.status(404).json({
            error: "Nem létezik ilyen auto"
        });
    }


    let osszBevetel = 0

    for (const b of berles) {
    b.dij = Number(b.dij)
    osszBevetel += b.dij
    }

    res.json({
    ...autok[0],
    napidij: Number(autok[0].napidij),
    berles,
    osszBevetel
})
})

export default router