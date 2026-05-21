import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    email: String!
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    genre: String!
    author: Author!
    authorId: ID!
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    authors: [Author!]!
    author(id: ID!): Author
  }

  type Mutation {
    createBook(title: String!, genre: String!, authorId: ID!): Book!
    createAuthor(name: String!, email: String!): Author!
  }
`;

const authors = [
  { id: '1', name: 'Лев Толстой', email: 'tolstoy@example.com' },
  { id: '2', name: 'Фёдор Достоевский', email: 'dostoevsky@example.com' },
];

const books = [
  { id: '1', title: 'Война и мир', genre: 'Роман-эпопея', authorId: '1' },
  { id: '2', title: 'Анна Каренина', genre: 'Роман', authorId: '1' },
  { id: '3', title: 'Преступление и наказание', genre: 'Роман', authorId: '2' },
];

const resolvers = {
  Query: {
    books: () => books,
    book: (_, { id }) => books.find(book => book.id === id),
    authors: () => authors,
    author: (_, { id }) => authors.find(author => author.id === id),
  },
  Mutation: {
    createBook: (_, { title, genre, authorId }) => {
      const newBook = {
        id: String(books.length + 1),
        title,
        genre,
        authorId,
      };
      books.push(newBook);
      return newBook;
    },
    createAuthor: (_, { name, email }) => {
      const newAuthor = {
        id: String(authors.length + 1),
        name,
        email,
      };
      authors.push(newAuthor);
      return newAuthor;
    },
  },
  Book: {
    author: (parent) => authors.find(author => author.id === parent.authorId),
  },
  Author: {
    books: (parent) => books.filter(book => book.authorId === parent.id),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`GraphQL Server ready at ${url}`);