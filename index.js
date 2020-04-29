const app = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const fs = require('fs');
const { uploader } = require('./uploader');
const port = 2000;
const util = require('util');

app.use(bodyParser());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'b1454cw',
    database: 'ujian',
    port: 3306
});
const dba = util.promisify(db.query).bind(db);

app.get('/', (req, res) => {
    res.status(200).send('<h1>Ujian Backend</h1>');
});

// =============== PRODUCT START ==================================
app.get('/get-product', async (req, res) => {
    let get = `SELECT * FROM product`;
    try {
        let response = await dba(get);
        res.status(200).send(response);
    } catch(err) {
        res.status(500).send(err.message);
    }
})

app.post('/add-product', async (req, res) => {
    const path = '/images';
    const upload = uploader(path, 'TDO').fields([{ name : 'image' }]) //TDD1231231 TDO123123123
    upload(req,res, async (err) => {
        const { nama, harga } = req.body;
        const { image } = req.files;
        // console.log(image)
        const imagePath = image ? `${path}/${image[0].filename}` : null
        // public/images/TDO123123123123
        // console.log(imagePath) // simpen di database
        let add = `INSERT INTO product (nama, harga, imagePath) VALUES ('${nama}', ${harga}, '${imagePath}')`;
        try {
            await dba(add);
            let get = `SELECT * FROM product`;
            let response = await dba(get)
            res.status(200).send(response)
        } catch(err) {
            res.status(500).send(err.message)
        }
    })
});

app.patch('/edit-product/:id', (req, res) => {
    let { id } = req.params;
    let sql = `SELECT * FROM product WHERE product_id = ${id}`;

    db.query(sql, (err,results) => {
        if(err) res.status(500).send(err.message)
        let oldImagePath = results[0].imagePath
        // console.log(oldImagePath);
        try{
            const path = '/images';
            const upload = uploader(path, 'TDO').fields([{ name : 'image' }])

            upload(req,res,(err) => {
                if(err) res.status(500).send(err.message);
                const { image } = req.files;
                const { nama, harga } = req.body;

                const imagePath = image ? `${path}/${image[0].filename}` : oldImagePath
                let sql = `UPDATE product SET nama = '${nama}', harga = ${harga}, imagePath = '${imagePath}' where product_id =${id}`;
                db.query(sql, (err,results) => {
                    if(err){
                        fs.unlinkSync(`../public${imagePath}`)
                        res.status(500).send(err.message)
                    }
                    if(image){
                        fs.unlinkSync(`./public${oldImagePath}`)
                    }
                    res.status(200).send({
                        status : 'Success',
                        message : 'Edit Data Successful'
                    })
                })
            })
        }catch(err){
            res.status(500).send(err.message);
        }
    })
});

app.delete('/delete-product/:id', async (req, res) => {
    // let { image } = req.files;
    let { id } = req.params;
    let sql = `SELECT * FROM product WHERE product_id = ${id}`;
    let response = await dba(sql);
    let image = response[0].imagePath;
    // console.log(image)
    try {
        // console.log(response);
        let deleteSql = `DELETE FROM product WHERE product_id = ${id}`;
        await dba(deleteSql);
        fs.unlinkSync(`./public${image}`)
        res.status(200).send({
            status : 'Deleted',
            message : 'Delete Succesful'
        })
    } catch(err) {
        res.status(500).send(err)
    }
})

// ==================== PRODUCT END ========================

// ==================== STORE START ========================

app.get('/get-store', async (req, res) => {
    let sql = `SELECT * FROM store`;
    try {
        let response = await dba(sql);
        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

app.post('/add-store', async (req, res) => {
    let sql = `INSERT INTO store SET ?`;
    try {
        await dba(sql, req.body);
        let get = `SELECT * FROM store`;
        let response = await dba(get);
        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

app.patch('/edit-store/:id', async (req, res) => {
    let sql = `UPDATE store SET ? WHERE store_id = ${req.params.id}`;
    try {
        await dba(sql, req.body);
        let get = `SELECT * FROM store`;
        let response = await dba(get);
        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

app.delete('/delete-store/:id', async (req, res) => {
    let sql = `DELETE FROM store WHERE store_id = ${req.params.id}`;
    try {
        await dba(sql, req.body);
        let get = `SELECT * FROM store`;
        let response = await dba(get);
        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

// ====================== STORE END =========================

// ====================== INVENTORY START ===================

app.get('/get-inventory', async (req, res) => {
    let sql = `
    SELECT 
        p.nama AS Product,
        s.branch_name AS 'Branch Name',
        i.inventory AS Stock
    FROM inventory i 
    JOIN product p ON i.product_id = p.product_id
    JOIN store s ON i.store_id = s.store_id`;

    try {
        let response = await dba(sql);
        res.status(200).send(response)
    } catch(err) {
        res.status(500).send(err.message)
    }
})

app.post('/add-inventory', async (req, res) => {
    let sql = `INSERT INTO inventory SET ?`;
    try {
        await dba(sql, req.body);
        let get = `SELECT * FROM inventory`;
        let response = await dba(get);
        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err.message)
    };
});

app.patch('/edit-inventory/:productId/:storeId', async (req, res) => {
    let { productId, storeId } = req.params;
    let { inventory } = req.body;
    // console.log(req.body)
    let sql = `UPDATE inventory SET inventory = ${inventory} WHERE product_id = ${productId} AND store_id = ${storeId}`;
    try {
        await dba(sql, req.body);
        let get = `SELECT * FROM inventory`;
        let response = await dba(get);
        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err.message);
    };
})

app.delete('/delete-inventory/:productId/:storeId', async (req, res) => {
    let { productId, storeId } = req.params;
    let sql = `DELETE FROM inventory WHERE product_id = ${productId} AND store_id = ${storeId}`;
    try {
        await dba(sql, req.body);
        let get = `SELECT * FROM inventory`;
        let response = await dba(get);
        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

// ====================== INVENTORY END ======================

app.listen(port, () => console.log(`API active at port ${port}`));