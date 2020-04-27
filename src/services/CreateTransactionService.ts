// import AppError from '../errors/AppError';

import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    category,
    title,
    type,
    value,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    let categoryObj = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryObj) {
      categoryObj = categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(categoryObj);
    }
    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();

      if (value > balance.total) {
        throw new AppError('Outcome value is bigger than incomes.');
      }
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryObj.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
