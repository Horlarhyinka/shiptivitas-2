import express from 'express';
import Database from 'better-sqlite3';
import { messageObj } from './errors';
import { STATUS, field_type_map, validateStatus } from './factory';
import { validateId } from './factory';
import { validatePriority } from './factory';
import fs from "fs"

const app = express();

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.get('/', (req, res) => {
  return res.status(200).send({'message': 'SHIPTIVITY API. Read documentation to see API docs'});
});

// We are keeping one connection alive for the rest of the life application for simplicity
export const db = new Database('./clients.db');

db.exec(``)

// Don't forget to close connection when server gets terminated
const closeDb = () => db.close();
process.on('SIGTERM', closeDb);
process.on('SIGINT', closeDb);
process.on("SIGINT", closeDb)
process.on("unhandledRejection", closeDb)
process.on("uncaughtException", closeDb)

app.get('/api/v1/clients', (req, res) => {
  const status = req.query.status;
  if (status) {
    if (!validateStatus(status).valid) {
      return res.status(400).send(messageObj.invalid_field_type("status", `one of the following [${Object.values(STATUS).join(" | ")}].`));
    }
    const clients = db.prepare('select * from clients where status = ?').all(status);
    return res.status(200).send(clients);
  }
  const statement = db.prepare('select * from clients');
  const clients = statement.all();
  return res.status(200).send(clients);
});

/**
 * Get a client based on the id provided.
 * GET /api/v1/clients/{client_id} - get client by id
 */
app.get('/api/v1/clients/:id', (req, res) => {
  const id = parseInt(req.params.id , 10);
  const { valid, messageObj } = validateId(id);
  if (!valid) {
    res.status(400).send(messageObj);
  }
  return res.status(200).send(db.prepare('select * from clients where id = ?').get(id));
});

/**
 * Update client information based on the parameters provided.
 * When status is provided, the client status will be changed
 * When priority is provided, the client priority will be changed with the rest of the clients accordingly
 * Note that priority = 1 means it has the highest priority (should be on top of the swimlane).
 * No client on the same status should not have the same priority.
 * This API should return list of clients on success
 *
 * PUT /api/v1/clients/{client_id} - change the status of a client
 *    Data:
 *      status (optional): 'backlog' | 'in-progress' | 'complete',
 *      priority (optional): integer,
 *
 */
app.put('/api/v1/clients/:id', (req, res) => {
  const id = parseInt(req.params.id , 10);
  if (!validateId(id).valid)return res.status(400).send(messageObj.invalid_field_type("id", "integer"));
  const status = req.body.status || req.query.status
  const priority = req.body.priority || req.query.priority
  if(!validateStatus(status).valid)return res.status(400).send(messageObj.invalid_field_type("status", `one of the following [${Object.values(STATUS).join(" | ")}].`));
  console.log({priority}, validatePriority(priority), isNaN(priority), Number.isNaN(priority))
  if(!validatePriority(priority).valid)return res.status(400).json(messageObj.invalid_field_type("priority", "a positive integer"))
  let clients = db.prepare('select * from clients order by priority').all();
  const client = clients.find(client => client.id === id);
if(client.status !== status || client.priority !== priority){
  const updateClientInfoQuery = db.prepare('UPDATE clients SET status = ?, priority = ? WHERE id = ?');
  const updatePriorityQuery = db.prepare('UPDATE clients SET priority = ? WHERE id = ?');
  updateClientInfoQuery.run(status, priority, client.id);
  clients.forEach(cl => {
    if(cl.id != client.id){
      if(cl.status === client.status && cl.priority >= priority){
        updatePriorityQuery.run(cl.priority - 1, cl.id)
      }
      if(cl.status === status && cl.priority >= priority){
        updatePriorityQuery.run(cl.priority + 1, cl.id)
      }
    }
  });
  clients = db.prepare("select * from clients").all()
  }
  return res.status(200).send(clients);
});

app.listen(3001);
console.log('app running on port ', 3001);
