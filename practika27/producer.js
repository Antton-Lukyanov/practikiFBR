import express from 'express';
import amqplib from 'amqplib';

const app = express();
app.use(express.json());

const QUEUE_NAME = 'task_queue';

app.post('/tasks', async (req, res) => {
  const task = req.body;

  if (!task.type || !task.payload) {
    return res.status(400).json({ error: 'Missing type or payload' });
  }

  const connection = await amqplib.connect('amqp://localhost');
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  const message = JSON.stringify(task);
  channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });

  console.log(`[Producer] Task sent: ${message}`);

  await channel.close();
  await connection.close();

  res.status(202).json({ status: 'accepted', task });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Producer API running on http://localhost:${PORT}`);
});