import { QueueService } from './domain.mjs';

const queue = new QueueService();
const issueButton = document.querySelector('#issue-button');
const callButton = document.querySelector('#call-button');
const finishButton = document.querySelector('#finish-button');
const announcement = document.querySelector('#announcement');
const currentTicket = document.querySelector('#current-ticket');
const waitingList = document.querySelector('#waiting-list');
const finishedList = document.querySelector('#finished-list');
const waitingCount = document.querySelector('#waiting-count');
const finishedCount = document.querySelector('#finished-count');

function announce(message, kind = '') {
  announcement.textContent = message;
  if (kind) {
    announcement.dataset.kind = kind;
  } else {
    delete announcement.dataset.kind;
  }
}

function renderTicketList(element, tickets, emptyMessage, statusLabel) {
  element.replaceChildren();

  if (tickets.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'list-empty';
    empty.textContent = emptyMessage;
    element.append(empty);
    return;
  }

  for (const ticket of tickets) {
    const row = document.createElement('li');
    row.className = 'ticket-row';

    const number = document.createElement('span');
    number.textContent = `Senha ${ticket.number}`;

    const status = document.createElement('small');
    status.textContent = statusLabel;

    row.append(number, status);
    element.append(row);
  }
}

function renderQueue() {
  const snapshot = queue.getSnapshot();
  waitingCount.textContent = String(snapshot.waiting.length);
  finishedCount.textContent = String(snapshot.finished.length);

  if (snapshot.current === null) {
    currentTicket.className = 'current-ticket empty-state';
    currentTicket.replaceChildren();

    const emptySymbol = document.createElement('span');
    emptySymbol.className = 'empty-symbol';
    emptySymbol.setAttribute('aria-hidden', 'true');
    emptySymbol.textContent = '—';

    const message = document.createElement('span');
    message.textContent = 'Nenhum atendimento em andamento';

    currentTicket.append(emptySymbol, message);
  } else {
    currentTicket.className = 'current-ticket has-ticket';
    currentTicket.replaceChildren();

    const number = document.createElement('span');
    number.className = 'ticket-number';
    number.textContent = String(snapshot.current.number);

    const caption = document.createElement('span');
    caption.className = 'ticket-caption';
    caption.textContent = 'Em atendimento';

    currentTicket.append(number, caption);
  }

  renderTicketList(waitingList, snapshot.waiting, 'Nenhuma senha aguardando', 'Aguardando');
  renderTicketList(finishedList, snapshot.finished, 'Nenhuma senha finalizada', 'Finalizada');
}

issueButton.addEventListener('click', () => {
  try {
    const ticket = queue.issueTicket();
    renderQueue();
    announce(`Senha ${ticket.number} emitida. Aguarde sua vez.`, 'success');
  } catch (error) {
    announce(`Não foi possível emitir a senha: ${error.message}`, 'error');
  }
});

callButton.addEventListener('click', () => {
  try {
    const ticket = queue.callNext();
    if (ticket === null) {
      announce('Não há senhas aguardando.', 'error');
      return;
    }

    renderQueue();
    announce(`Senha ${ticket.number} chamada para atendimento.`, 'success');
  } catch (error) {
    if (error.code === 'ACTIVE_TICKET_EXISTS') {
      announce('Já existe um atendimento em andamento. Finalize-o antes de chamar outra senha.', 'error');
      return;
    }

    announce(`Não foi possível chamar a próxima senha: ${error.message}`, 'error');
  }
});

finishButton.addEventListener('click', () => {
  try {
    const ticket = queue.finishCurrent();
    if (ticket === null) {
      announce('Não existe atendimento atual para finalizar.', 'error');
      return;
    }

    renderQueue();
    announce(`Atendimento da senha ${ticket.number} finalizado.`, 'success');
  } catch (error) {
    announce(`Não foi possível finalizar o atendimento: ${error.message}`, 'error');
  }
});

renderQueue();
