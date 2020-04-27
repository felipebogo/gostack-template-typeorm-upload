import { EntityRepository, Repository, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = await transactionsRepository.find();

    const balance = transactions.reduce(
      (balanceSum: Balance, transaction) => {
        const income =
          balanceSum.income +
          (transaction.type === 'income' ? transaction.value : 0);
        const outcome =
          balanceSum.outcome +
          (transaction.type === 'outcome' ? transaction.value : 0);
        const total = income - outcome;
        return { income, outcome, total };
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    return balance;
  }
}

export default TransactionsRepository;
