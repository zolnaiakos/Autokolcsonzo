import pool from '../data/db.js'
import { Router } from 'express'

const router = Router()

//feladat megoldásához AI segítségét használtam, inkább a hibakezelésekhez
router.post('/', async(req,res)=>{
    const {autoId, ugyfelId, kezdet, veg} = req.body

    let hibak = []

    if (!Number.isInteger(Number(autoId)) || autoId === undefined || autoId === null || autoId === '' || Number(autoId) <= 0) {
        hibak.push('Hibás autó azonosító')
    }

    if (!Number.isInteger(Number(ugyfelId)) || ugyfelId === undefined || ugyfelId === null || ugyfelId === '' || Number(ugyfelId) <= 0) {
        hibak.push('Hibás ügyfél azonosító')
    }

    const datum = /^\d{4}-\d{2}-\d{2}$/

    if (!datum.test(kezdet)) {
        hibak.push('Hibás kezdő dátum')
    } else {
        const d = new Date(kezdet)
        if (d.toISOString().slice(0, 10) !== kezdet) {
            hibak.push('Nem létező kezdő dátum')
        }
    }

    if (!datum.test(veg)) {
        hibak.push('Hibás záró dátum')
    } else {
        const d = new Date(veg)
        if (d.toISOString().slice(0, 10) !== veg) {
            hibak.push('Nem létező záró dátum')
        }
    }

    if (kezdet && veg && kezdet > veg) {
        hibak.push('A záró dátum nem lehet a kezdő dátum előtt')
    }

    if (hibak.length > 0) {
        return res.status(400).json({hibak})
    }

    const [autok] = await pool.query(
        'SELECT * FROM autok WHERE id = ?',
        [autoId]
    )

    if (autok.length === 0) {
        return res.status(404).json({
            error: 'Nem létezik ilyen autó'
        })
    }

    const [ugyfelek] = await pool.query(
        'SELECT * FROM ugyfelek WHERE id = ?',
        [ugyfelId]
    )

    if (ugyfelek.length === 0) {
        return res.status(404).json({
            error: 'Nem létezik ilyen ügyfél'
        })
    }

    if (ugyfelek[0].jogositvany_ervenyes < veg) {
        return res.status(409).json({
            error: 'Tóth Gergely jogosítványa 2026-12-10-én lejár'
        })
    }

    const [utkozes] = await pool.query(`
        SELECT id
        FROM berlesek
        WHERE auto_id = ?
        AND kezdet <= ?
        AND veg >= ?
    `, [autoId, veg, kezdet])

    if (utkozes.length > 0) {
        return res.status(409).json({
            error: 'Az autó már foglalt ebben az időszakban'
        })
    }

    const [eredmeny] = await pool.query(`
        INSERT INTO berlesek (auto_id, ugyfel_id, kezdet, veg)
        VALUES (?, ?, ?, ?)
    `, [autoId, ugyfelId, kezdet, veg])

    const napok = Math.round(
        (new Date(veg) - new Date(kezdet)) / (1000 * 60 * 60 * 24)
    ) + 1

    const dij = napok * Number(autok[0].napidij)

    res.status(201).json({
        id: eredmeny.insertId,
        rendszam: autok[0].rendszam,
        ugyfel: ugyfelek[0].nev,
        kezdet,
        veg,
        napok,
        dij
    })
})

export default router