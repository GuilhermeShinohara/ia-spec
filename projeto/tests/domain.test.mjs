import test from 'node:test';
import assert from 'node:assert/strict';
import { QueueService } from '../src/domain.mjs';

test('AC-01 — emite números sequenciais começando em 1', () => {
  const queue = new QueueService();

  assert.deepEqual(
    [queue.issueTicket().number, queue.issueTicket().number, queue.issueTicket().number],
    [1, 2, 3],
  );
});

test('AC-02 — inicia cada senha no estado WAITING', () => {
  const queue = new QueueService();

  assert.equal(queue.issueTicket().status, 'WAITING');
});

test('AC-03 — chama senhas em ordem FIFO', () => {
  const queue = new QueueService();
  [1, 2, 3].forEach(() => queue.issueTicket());

  const calledNumbers = [];
  for (let index = 0; index < 3; index += 1) {
    calledNumbers.push(queue.callNext().number);
    queue.finishCurrent();
  }

  assert.deepEqual(calledNumbers, [1, 2, 3]);
});

test('AC-04 — rejeita uma nova chamada quando já existe atendimento atual', () => {
  const queue = new QueueService();
  queue.issueTicket();
  queue.issueTicket();
  queue.callNext();
  const before = queue.getSnapshot();

  assert.throws(
    () => queue.callNext(),
    (error) => error.code === 'ACTIVE_TICKET_EXISTS',
  );
  assert.deepEqual(queue.getSnapshot(), before);
});

test('AC-05 — retorna null sem alterar a fila quando não há senhas aguardando', () => {
  const queue = new QueueService();
  const before = queue.getSnapshot();

  assert.equal(queue.callNext(), null);
  assert.deepEqual(queue.getSnapshot(), before);
});

test('AC-06 — finaliza a senha atual e limpa current', () => {
  const queue = new QueueService();
  queue.issueTicket();
  queue.callNext();

  const finished = queue.finishCurrent();
  const snapshot = queue.getSnapshot();

  assert.equal(finished.status, 'FINISHED');
  assert.equal(snapshot.current, null);
  assert.deepEqual(snapshot.finished.map((ticket) => ticket.number), [1]);
});

test('AC-07 — retorna null sem alterar a fila quando não há atendimento atual', () => {
  const queue = new QueueService();
  const before = queue.getSnapshot();

  assert.equal(queue.finishCurrent(), null);
  assert.deepEqual(queue.getSnapshot(), before);
});
