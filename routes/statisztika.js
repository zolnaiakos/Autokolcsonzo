import pool from '../data/db.js'
import { Router } from 'express'

const router = Router()


router.get('/kategoriak', async(req,res)=>{
    const [eredmeny] = await pool.query(`
        SELECT a.kategoria, COUNT(DISTINCT a.id) AS autoDb, COUNT(b.id) AS berlesDb, COALESCE(SUM(DATEDIFF(b.veg, b.kezdet) + 1), 0) AS napDb, COALESCE(SUM((DATEDIFF(b.veg, b.kezdet) + 1) * a.napidij), 0) AS bevetel
        FROM autok a
        LEFT JOIN berlesek b ON b.auto_id = a.id
        GROUP BY a.kategoria
        ORDER BY bevetel DESC
    `)

     for (const k of eredmeny) {
        k.autoDb = Number(k.autoDb)
        k.berlesDb = Number(k.berlesDb)
        k.napDb = Number(k.napDb)
        k.bevetel = Number(k.bevetel)
    }

    res.json(eredmeny)
})


router.get('/havi', async(req,res)=>{
    const [eredmeny] = await pool.query(`
        SELECT DATE_FORMAT(b.kezdet, '%Y-%m') AS honap, COUNT(b.id) AS berlesDb, SUM((DATEDIFF(b.veg, b.kezdet) + 1) * a.napidij) AS bevetel
        FROM berlesek b
        LEFT JOIN autok a ON a.id = b.auto_id
        GROUP BY DATE_FORMAT(b.kezdet, '%Y-%m')
        ORDER BY honap ASC
    `)

    for (const h of eredmeny) {
        h.berlesDb = Number(h.berlesDb)
        h.bevetel = Number(h.bevetel)
    }

    res.json(eredmeny)
})


export default router