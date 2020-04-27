import { getCustomRepository } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, fileName);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      delimiter: ', ',
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: Request[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      lines.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const createTransaction = new CreateTransactionService();
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions: Transaction[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const request of lines) {
      const { title, type, value, category } = request;
      // eslint-disable-next-line no-await-in-loop
      const transaction = await createTransaction.execute({
        title,
        type,
        value,
        category,
      });
      const transDb = transactionsRepository.create(transaction);
      transactions.push(transDb);
    }
    await transactionsRepository.save(transactions);
    return transactions;
  }
}

export default ImportTransactionsService;
