const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const paypal = require('paypal-rest-sdk');
const mysql = require('mysql');

paypal.configure({
  'mode': 'sandbox',
  'client_id': 'AcNFUC7X_O5g0myaT8DrOUv8r1mWh2M4k_4cOJWPwKYiml5yRGqLQby-xDdq8f5JB3lfztGDfAJ83r5n',
  'client_secret': 'EHey5rxzSyDv03Sk33yqP9KJtYXJ0sDhkZvN8a-EgWY2YY4ldi61QxdAAtu4kfuTLJ7HpQdfu8CAlyP-',
});
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'timothy',
    password: 'Tim??..0964343103',
    database: 'zm'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => res.render('index'));

app.post('/pay', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal",
        },
        "redirect_urls": {
            "return_url": "http://localhost:4000/success",
            "cancel_url": "http://localhost:4000/cancel",
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Red",
                    "sku": "001",
                    "price": "25.00",
                    "currency": "USD",
                    "quantity": 1,
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "25.00",
            },
            "description": "This is the payment description.",
        }],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                    break;
                }
            }
        }
    });
});

app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "25.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));

            const payerInfo = {
                name: req.query.name,       // Assuming you're passing name as a query parameter
                address: req.query.address // Assuming you're passing address as a query parameter
            };

            const query = `INSERT INTO payments (paymentId, payerId, amount, currency, name, address) VALUES (?, ?, ?, ?, ?, ?)`;
            const values = [paymentId, payerId, 25.00, "USD", payerInfo.name, payerInfo.address];

            connection.query(query, values, (err, result) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('Payment and personal data saved to database.');
                    res.render('success');
                }
            });
        }
    });
});

app.listen(4000, () => console.log('Server started'));
