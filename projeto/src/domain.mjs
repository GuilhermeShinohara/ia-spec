export class Ticket {
  constructor(number) {
    this.number = number;
    this.status = 'WAITING';
    this.createdAt = new Date();
  }

  call() {
    if (this.status !== 'WAITING') {
      throw createTransitionError();
    }

    this.status = 'CALLED';
  }

  finish() {
    if (this.status !== 'CALLED') {
      throw createTransitionError();
    }

    this.status = 'FINISHED';
  }
}

export class QueueSnapshot {
  constructor(current, waiting, finished) {
    this.current = current;
    this.waiting = waiting;
    this.finished = finished;
  }
}

export class QueueService {
  #tickets = [];
  #currentTicket = null;
  #nextNumber = 1;

  issueTicket() {
    const ticket = new Ticket(this.#nextNumber);
    this.#tickets.push(ticket);
    this.#nextNumber += 1;
    return ticket;
  }

  callNext() {
    if (this.#currentTicket !== null) {
      throw createError('ACTIVE_TICKET_EXISTS');
    }

    const ticket = this.#tickets.find((item) => item.status === 'WAITING');
    if (ticket === undefined) {
      return null;
    }

    ticket.call();
    this.#currentTicket = ticket;
    return ticket;
  }

  finishCurrent() {
    if (this.#currentTicket === null) {
      return null;
    }

    const ticket = this.#currentTicket;
    ticket.finish();
    this.#currentTicket = null;
    return ticket;
  }

  getSnapshot() {
    return new QueueSnapshot(
      this.#currentTicket,
      this.#tickets.filter((ticket) => ticket.status === 'WAITING'),
      this.#tickets.filter((ticket) => ticket.status === 'FINISHED'),
    );
  }
}

function createTransitionError() {
  return createError('INVALID_TICKET_TRANSITION');
}

function createError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}
