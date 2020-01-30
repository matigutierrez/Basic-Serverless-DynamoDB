'use strict';

const serverless = require('serverless-http');
const express = require('express');
const app = express()
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const USERS_TABLE = process.env.USERS_TABLE;
const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDB;

if(IS_OFFLINE === 'true') {
  dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
} else {
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}

app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
  res.send('hola mundo');
});

app.post('/users', (req, res) => {
  const {userId, name } = req.body

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId, name
    }
  }

  dynamoDB.put(params, (error) => {
    if(error) {
      console.log(error)
      res.status(400).json({
        error: 'no se ha podido crear usuario'
      })
    } else {
      res.json({userId, name});
    }
  });
});

app.get('/users', (req, res) => {

  const params = {
    TableName: USERS_TABLE,
  }

  dynamoDB.scan(params, (error, result) => {
    if(error) {
      console.log(error)
      res.status(400).json({
        error: 'no se ha podido obtener usuarios'
      })
    } else {
      const { Items } = result;
      res.json({
        success: true,
        message: 'Usuarios cargados correctamente',
        users: Items
      });
    }
  });
});

app.get('/users/:userId', (req, res) => {

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId
    }
  }

  dynamoDB.get(params, (error, result) => {
    if(error) {
      console.log(error)
      return res.status(400).json({
        error: 'no se ha podido obtener el usuario'
      })
    }

    if(result.Item) {
      const { userId, name } = result.Item;
      res.json({userId, name});
    } else res.status(404).json({ error: 'usuario no encontrado' })
  });
});

module.exports.generic = serverless(app)