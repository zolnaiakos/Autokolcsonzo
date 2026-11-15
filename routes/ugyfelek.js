import pool from '../data/db.js'
import { Router } from 'express'

const router = Router();


router.get('/', async(req,res)=>{
    const [eredmeny] = await pool.query (`
    SELECT u.id, u.nev, COUNT(b.id) AS berlesDb, COALESCE(SUM(DATEDIFF(b.veg, b.kezdet) + 1), 0) AS osszNap, COALESCE(SUM((DATEDIFF(b.veg, b.kezdet) + 1) * a.napidij), 0) AS osszKoltes
    FROM ugyfelek u    
    LEFT JOIN berlesek b ON b.ugyfel_id = u.id
    LEFT JOIN autok a ON a.id = b.auto_id
    GROUP BY u.id, u.nev
    ORDER BY osszKoltes DESC
`)


    for (const u of eredmeny) {
    u.osszKoltes = Number(u.osszKoltes)
    u.osszNap = Number(u.osszNap)
    u.berlesDb = Number(u.berlesDb)
    }

    res.json(eredmeny)

})


export default router