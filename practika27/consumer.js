import amqplib from 'amqplib';

const QUEUE_NAME = 'task_queue';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

const WORKER_ID = process.env.WORKER_ID || '1';

async function processTask(task) {
  console.log(`[Worker ${WORKER_ID}] Processing task:`, task);

  await new Promise(resolve => setTimeout(resolve, 2000));

  if (Math.random() < 0.5) {
    throw new Error('Temporary processing failure');
  }

  console.log(`[Worker ${WORKER_ID}] Task completed successfully`);
}

async function processWithRetry(channel, originalMsg, task, retryCount) {
  try {
    await processTask(task);
    channel.ack(originalMsg);
    console.log(`[Worker ${WORKER_ID}] Task acknowledged`);
  } catch (err) {
    console.error(`[Worker ${WORKER_ID}] Error: ${err.message}, retryCount: ${retryCount}/${MAX_RETRIES}`);

    if (retryCount < MAX_RETRIES) {
      const exponentialDelay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
      const jitter = Math.random() * 1000;
      const delay = exponentialDelay + jitter;

      console.log(`[Worker ${WORKER_ID}] Retry after ${Math.round(delay)}ms`);

      setTimeout(async () => {
        await processWithRetry(channel, originalMsg, task, retryCount + 1);
      }, delay);
    } else {
      console.error(`[Worker ${WORKER_ID}] Max retries exhausted. Message will go to DLQ`);
      channel.nack(originalMsg, false, false);
    }
  }
}

async function startConsumer() {
  const connection = await amqplib.connect('amqp://localhost');
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  channel.prefetch(1);

  console.log(`[Worker ${WORKER_ID}] Waiting for messages in ${QUEUE_NAME}...`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const task = JSON.parse(msg.content.toString());
    console.log(`[Worker ${WORKER_ID}] Received task:`, task);

    await processWithRetry(channel, msg, task, 1);
  });
}

startConsumer();